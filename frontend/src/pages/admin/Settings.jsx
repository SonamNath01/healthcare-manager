import { useAuth } from "../../context/AuthContext";

export function AdminSettings() {
  const { user } = useAuth();

  return (
    <div className="max-w-lg">
      <h2 className="font-display text-[15px] font-semibold text-ink">Account</h2>
      <div className="mt-3 rounded-lg border border-line bg-surface p-5">
        <p className="text-[13px] text-ink-faint">Name</p>
        <p className="text-[14px] text-ink">{user?.name}</p>
        <p className="mt-3 text-[13px] text-ink-faint">Email</p>
        <p className="text-[14px] text-ink">{user?.email}</p>
      </div>
    </div>
  );
}
