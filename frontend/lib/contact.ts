/**
 * Single source of truth for the school's public contact details.
 *
 * The display strings also live in messages/*.json so each locale can format
 * them (and so the labels around them translate), but the values used to build
 * mailto:/tel: hrefs and map links belong here — they must never differ
 * between languages.
 */
export const CONTACT_EMAIL = "mmrek07@gmail.com";

/** Human-readable phone number. */
export const CONTACT_PHONE = "+996 558 553 177";

/** Same number without spaces, for tel: links. */
export const CONTACT_PHONE_HREF = "+996558553177";

/** 2GIS place links for the two Bishkek campuses. */
export const BRANCH_2GIS_MAIN = "https://go.2gis.com/mo1pG";
export const BRANCH_2GIS_SECOND = "https://go.2gis.com/dwDxu";

/** Social profiles. Only the ones that actually exist are listed. */
export const SOCIAL_INSTAGRAM = "https://www.instagram.com/it.adis/";
