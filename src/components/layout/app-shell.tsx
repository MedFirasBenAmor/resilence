import type { ReactNode } from "react";

type AppShellProps = {
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
};

export function AppShell({ sidebar, topbar, children }: AppShellProps) {
  return (
    <div className="app-shell-bg min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1800px] flex-col lg:flex-row lg:items-start">
        {sidebar}
        <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:self-stretch">
          {topbar}
          <div className="flex-1 px-3 pb-8 pt-3 sm:px-5 sm:pt-4 lg:px-8 lg:pb-10 lg:pt-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
