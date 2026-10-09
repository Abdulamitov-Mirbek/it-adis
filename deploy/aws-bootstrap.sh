#!/usr/bin/env bash
# One-time AWS setup so GitHub Actions can deploy to the EC2 host.
#
# RUN THIS IN AWS CLOUDSHELL (EC2 console, bottom-left "CloudShell" button),
# signed in as a user who can create IAM roles. It is idempotent — re-running
# it is safe.
#
# It creates three things:
#   1. an instance profile with AmazonSSMManagedInstanceCore, attached to the
#      box, so SSM Run Command can reach it at all
#   2. the GitHub OIDC identity provider
#   3. a deploy role GitHub assumes, trusted ONLY by this repo on master, and
#      allowed only to send one SSM document to this one instance
#
# Nothing long-lived is created: no access keys, no SSH key in GitHub.
set -euo pipefail

REGION=eu-north-1
INSTANCE=i-0cef3e76ef5f0c744
REPO=Abdulamitov-Mirbek/it-adis
EC2_ROLE=itadis-ec2-ssm
DEPLOY_ROLE=itadis-github-deploy

ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
echo "account: $ACCOUNT   region: $REGION   instance: $INSTANCE"
echo

# ── 1. Let SSM manage the instance ───────────────────────────────────────────
echo "==> instance profile $EC2_ROLE"
aws iam create-role --role-name "$EC2_ROLE" \
  --description "Lets SSM manage the IT ADIS web host" \
  --assume-role-policy-document '{
    "Version":"2012-10-17",
    "Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]}' \
  >/dev/null 2>&1 && echo "    role created" || echo "    role already exists"

aws iam attach-role-policy --role-name "$EC2_ROLE" \
  --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
echo "    AmazonSSMManagedInstanceCore attached"

aws iam create-instance-profile --instance-profile-name "$EC2_ROLE" \
  >/dev/null 2>&1 && echo "    instance profile created" || echo "    instance profile already exists"
aws iam add-role-to-instance-profile --instance-profile-name "$EC2_ROLE" \
  --role-name "$EC2_ROLE" >/dev/null 2>&1 && echo "    role added to profile" || echo "    role already in profile"

# An instance can only have one profile associated; ignore the error if it has one.
aws ec2 associate-iam-instance-profile --region "$REGION" \
  --instance-id "$INSTANCE" --iam-instance-profile "Name=$EC2_ROLE" \
  >/dev/null 2>&1 && echo "    profile associated with $INSTANCE" \
  || echo "    NOTE: instance already has a profile — check it includes AmazonSSMManagedInstanceCore"

# ── 2. GitHub as an OIDC identity provider ───────────────────────────────────
echo
echo "==> GitHub OIDC provider"
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 \
  >/dev/null 2>&1 && echo "    created" || echo "    already exists"

# ── 3. The role GitHub assumes ───────────────────────────────────────────────
# `sub` pins this to one repo AND one branch. Without the ref condition, any
# branch or PR in the repo could assume it, which means anyone who can open a
# PR could run commands on the server.
echo
echo "==> deploy role $DEPLOY_ROLE"
cat > /tmp/itadis-trust.json <<JSON
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::${ACCOUNT}:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": "repo:${REPO}:ref:refs/heads/master"
      }
    }
  }]
}
JSON

aws iam create-role --role-name "$DEPLOY_ROLE" \
  --description "GitHub Actions deploys IT ADIS to EC2 via SSM" \
  --assume-role-policy-document file:///tmp/itadis-trust.json >/dev/null 2>&1 \
  && echo "    role created" \
  || { aws iam update-assume-role-policy --role-name "$DEPLOY_ROLE" \
         --policy-document file:///tmp/itadis-trust.json; echo "    trust policy updated"; }

# Narrow on purpose: one document, one instance. The read actions do not accept
# a resource ARN, so they are "*" — they only ever reveal command output.
cat > /tmp/itadis-perm.json <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ssm:SendCommand",
      "Resource": [
        "arn:aws:ec2:${REGION}:${ACCOUNT}:instance/${INSTANCE}",
        "arn:aws:ssm:${REGION}::document/AWS-RunShellScript"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["ssm:GetCommandInvocation","ssm:ListCommands","ssm:ListCommandInvocations"],
      "Resource": "*"
    }
  ]
}
JSON

aws iam put-role-policy --role-name "$DEPLOY_ROLE" \
  --policy-name ssm-deploy --policy-document file:///tmp/itadis-perm.json
echo "    permissions attached"
rm -f /tmp/itadis-trust.json /tmp/itadis-perm.json

# ── Done ─────────────────────────────────────────────────────────────────────
echo
echo "============================================================"
echo "Put these in GitHub -> Settings -> Secrets and variables -> Actions"
echo
echo "  Secret   AWS_DEPLOY_ROLE_ARN = arn:aws:iam::${ACCOUNT}:role/${DEPLOY_ROLE}"
echo "  Variable AWS_REGION          = ${REGION}"
echo "  Variable EC2_INSTANCE_ID     = ${INSTANCE}"
echo "  Variable SITE_URL            = http://<the box's IP or domain>"
echo "============================================================"
echo
echo "Then confirm SSM can see the box (may take 2-3 minutes):"
echo "  aws ssm describe-instance-information --region ${REGION} \\"
echo "    --query \"InstanceInformationList[].{id:InstanceId,ping:PingStatus}\""
echo
echo "If it never appears, the agent has not picked up the new role yet:"
echo "  aws ec2 reboot-instances --region ${REGION} --instance-ids ${INSTANCE}"
