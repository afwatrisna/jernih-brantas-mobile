import type { ReactNode } from "react";

export type MonitoringFeatureProps = { children: ReactNode };

export default function MonitoringFeature({ children }: MonitoringFeatureProps) {
  return <section data-feature="monitoring">{children}</section>;
}
