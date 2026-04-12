export default function LogoutModal({ onConfirm, onClose }) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex flex-col items-center gap-5 text-center modal-box p-7">
        <div>
          <div className="mb-3 text-5xl">👋</div>
          <p className="font-black text-[18px] text-txt-primary mb-2">
            Sign out?
          </p>
          <p className="text-[13.5px] text-txt-muted">
            You'll need to sign in again to access your chats.
          </p>
        </div>
        <div className="flex gap-2.5 w-full">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-danger" onClick={onConfirm}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
