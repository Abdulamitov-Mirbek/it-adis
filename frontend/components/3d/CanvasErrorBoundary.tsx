"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";

/**
 * Isolates the WebGL subtree from the rest of the page.
 *
 * The 3D hero is decoration. A driver quirk, a lost GPU context or a shader
 * that fails to compile on some device must degrade to the static fallback —
 * it must never be able to take the marketing site down with it, which is
 * exactly what happened before this boundary existed.
 */
export class CanvasErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Logged rather than swallowed: a silent failure here is very hard to
    // diagnose, because React reports nothing for a caught error in production.
    console.error(
      "[IT ADIS] 3D scene failed, falling back to static hero:",
      error?.message,
      info?.componentStack
    );
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="w-full h-full"
          data-canvas-error={this.state.error.message?.slice(0, 300) || "unknown"}
        >
          {this.props.fallback}
        </div>
      );
    }
    return this.props.children;
  }
}
