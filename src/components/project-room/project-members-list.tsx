import { levelLabels } from "@/lib/ui/status-labels";

type ProjectMembersListProps = {
  members: Array<{
    id: string;
    name: string;
    email: string;
    level: keyof typeof levelLabels;
    roleLabel: string | null;
  }>;
};

export function ProjectMembersList({ members }: ProjectMembersListProps) {
  return (
    <section className="app-panel p-6">
      <p className="app-eyebrow">Équipe</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
        Membres projet
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Les personnes actives sur cette mission et leur niveau actuel.
      </p>

      <div className="mt-5 space-y-4">
        {members.map((member) => (
          <article
            key={member.id}
            className="rounded-[1.35rem] border border-slate-200/90 bg-white/84 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-100 text-sm font-semibold text-slate-700">
                {member.name
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-slate-950">{member.name}</h3>
                <p className="mt-1 truncate text-sm text-slate-600">{member.email}</p>
              </div>
            </div>
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              {levelLabels[member.level]}
              {member.roleLabel ? ` - ${member.roleLabel}` : ""}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
