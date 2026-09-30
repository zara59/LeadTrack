import { useEffect, useState } from 'react';
import LeadForm from './LeadForm.jsx';
import Modal from './Modal.jsx';
import { IconPlus } from './Icons.jsx';
import { LEAD_SOURCES, LEAD_STATUSES } from '../data/constants.js';

const TO_FORM = (lead) => ({
  name: lead?.name ?? '',
  company: lead?.company ?? '',
  email: lead?.email ?? '',
  phone: lead?.phone ?? '',
  source: lead?.source ?? LEAD_SOURCES[0].value,
  status: lead?.status ?? LEAD_STATUSES[0].value,
  notes: lead?.notes ?? '',
});

/**
 * Shared Add / Edit lead dialog.
 *
 * `lead` is null when adding, an existing lead when editing. Submission calls
 * the API (via the leads context) and waits for the server response: it stays
 * open and shows the error while saving, closes only after a successful save,
 * and surfaces backend validation `details` on the matching fields.
 */
export default function LeadModal({ open, lead, onClose, onSubmit }) {
  const isEdit = Boolean(lead);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [serverErrors, setServerErrors] = useState({});

  // Reset transient state whenever the dialog is (re)opened for a target.
  useEffect(() => {
    if (open) {
      setSubmitting(false);
      setApiError(null);
      setServerErrors({});
    }
  }, [open, isEdit, lead]);

  async function handleSubmit(values) {
    setSubmitting(true);
    setApiError(null);
    setServerErrors({});
    try {
      await onSubmit(values);
      onClose();
    } catch (err) {
      setSubmitting(false);
      if (err.details && typeof err.details === 'object') {
        setServerErrors(err.details);
      }
      setApiError(err.message ?? 'Something went wrong. Please try again.');
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? 'Edit lead' : 'Add a new lead'}
      subtitle={
        isEdit
          ? `Update the details for ${lead.name}.`
          : 'Fill in the details below. Required fields are marked.'
      }
      onClose={() => {
        if (!submitting) onClose();
      }}
      footer={
        <>
          <span className="modal__footer-note">
            {isEdit ? 'Changes apply immediately.' : 'Saved to your workspace on submit.'}
          </span>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="lead-form"
            className="btn btn--primary"
            disabled={submitting}
          >
            {submitting ? <Spinner /> : <IconPlus size={16} />}
            {submitting ? (isEdit ? 'Saving…' : 'Adding…') : isEdit ? 'Save changes' : 'Add Lead'}
          </button>
        </>
      }
    >
      {apiError ? (
        <p className="alert alert--error" role="alert" data-testid="lead-form-error">
          {apiError}
        </p>
      ) : null}
      <LeadForm
        key={isEdit ? lead.id : 'add'}
        initialValues={TO_FORM(lead)}
        onSubmit={handleSubmit}
        serverErrors={serverErrors}
      />
    </Modal>
  );
}

function Spinner() {
  return <span className="btn-spinner" aria-hidden="true" />;
}