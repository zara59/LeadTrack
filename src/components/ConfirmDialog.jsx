import { useState } from 'react';
import Avatar from './Avatar.jsx';
import Modal from './Modal.jsx';
import { IconTrash } from './Icons.jsx';

/**
 * Delete confirmation dialog, driven by the leads context.
 *
 * `onConfirm` triggers the real DELETE request. The dialog keeps itself open
 * (spinner in the button) until the server responds, and surfaces failures
 * inline so nothing is removed unless the backend confirms the deletion.
 */
export default function ConfirmDialog({ open, lead, onCancel, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  async function handleConfirm() {
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setDeleting(false);
      setError(err.message ?? 'Could not delete the lead.');
    }
  }

  return (
    <Modal
      open={open}
      title="Delete this lead?"
      subtitle="This action cannot be undone."
      onClose={() => {
        if (!deleting) onCancel();
      }}
      footer={
        <>
          <span className="modal__footer-note">
            Permanently removed from your workspace.
          </span>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onCancel}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={handleConfirm}
            disabled={deleting}
          >
            {deleting ? <span className="btn-spinner" aria-hidden="true" /> : <IconTrash size={16} />}
            {deleting ? 'Deleting…' : 'Delete lead'}
          </button>
        </>
      }
    >
      <div className="confirm-body">
        <span className="confirm-icon" aria-hidden="true">
          <IconTrash size={22} />
        </span>
        <div>
          <p className="t-body" style={{ fontWeight: 550 }}>
            You are about to remove <strong>{lead?.name}</strong>
            {lead?.company ? ` from ${lead.company}` : ''} and all its details from your
            workspace.
          </p>
          {lead ? (
            <div className="confirm-lead">
              <Avatar name={lead.name} size="sm" tinted />
              <span className="truncate">
                <span className="cell-person__name truncate">{lead.name}</span>
                <span className="cell-person__mail truncate">
                  {lead.company} · {lead.email}
                </span>
              </span>
            </div>
          ) : null}
          {error ? (
            <p className="alert alert--error" role="alert" data-testid="confirm-error">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}