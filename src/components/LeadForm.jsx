import { useState } from 'react';
import { LEAD_SOURCES, LEAD_STATUSES } from '../data/constants.js';

const EMPTY_LEAD = {
  name: '',
  company: '',
  email: '',
  phone: '',
  source: LEAD_SOURCES[0].value,
  status: LEAD_STATUSES[0].value,
  notes: '',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Field-level validation: required fields + basic email format. */
function validate(values) {
  const errors = {};

  if (!values.name.trim()) errors.name = 'Full name is required.';
  if (!values.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (values.phone.trim() && values.phone.trim().length < 6) {
    errors.phone = 'Enter a valid phone number.';
  }

  return errors;
}

/**
 * Add / Edit lead form (controlled, with inline validation).
 *
 * `initialValues` pre-fills the form when editing. `serverErrors` are backend
 * field-level `details`, surfaced next to the matching input after a rejected
 * submit. Submission happens through `onSubmit(values)` and is owned by the
 * parent (LeadModal), which waits on the real API call.
 */
export default function LeadForm({ initialValues, onSubmit, formId = 'lead-form', serverErrors = {} }) {
  const [values, setValues] = useState({ ...EMPTY_LEAD, ...initialValues });
  const [errors, setErrors] = useState({});

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      ...values,
      name: values.name.trim(),
      company: values.company.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      notes: values.notes.trim(),
    });
  }

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        <Field
          id="lead-name"
          label="Full Name"
          required
          error={errors.name ?? serverErrors.name}
          value={values.name}
          placeholder="e.g. Priya Raghunathan"
          onChange={(value) => update('name', value)}
        />
        <Field
          id="lead-company"
          label="Company"
          error={errors.company ?? serverErrors.company}
          value={values.company}
          placeholder="e.g. Lumen Analytics"
          onChange={(value) => update('company', value)}
        />
        <Field
          id="lead-email"
          label="Email"
          type="email"
          required
          error={errors.email ?? serverErrors.email}
          value={values.email}
          placeholder="name@company.com"
          onChange={(value) => update('email', value)}
        />
        <Field
          id="lead-phone"
          label="Phone"
          type="tel"
          error={errors.phone ?? serverErrors.phone}
          value={values.phone}
          placeholder="+1 (555) 000-0000"
          onChange={(value) => update('phone', value)}
        />

        <div className="form-field">
          <label className="form-field__label" htmlFor="lead-source">
            Lead Source
          </label>
          <select
            id="lead-source"
            className="select"
            value={values.source}
            aria-invalid={errors.source || serverErrors.source ? 'true' : undefined}
            onChange={(event) => update('source', event.target.value)}
          >
            {LEAD_SOURCES.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </select>
          {errors.source ?? serverErrors.source ? (
            <p className="form-error" role="alert">
              {errors.source ?? serverErrors.source}
            </p>
          ) : null}
        </div>

        <div className="form-field">
          <label className="form-field__label" htmlFor="lead-status">
            Status
          </label>
          <select
            id="lead-status"
            className="select"
            value={values.status}
            onChange={(event) => update('status', event.target.value)}
          >
            {LEAD_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field form-field--full">
          <label className="form-field__label" htmlFor="lead-notes">
            Notes <span>optional</span>
          </label>
          <textarea
            id="lead-notes"
            className="textarea"
            value={values.notes}
            placeholder="Context, budget, next steps, or anything worth remembering about this lead."
            onChange={(event) => update('notes', event.target.value)}
          />
          {errors.notes ?? serverErrors.notes ? (
            <p className="form-error" role="alert">
              {errors.notes ?? serverErrors.notes}
            </p>
          ) : null}
        </div>
      </div>
    </form>
  );
}

function Field({ id, label, value, onChange, error, type = 'text', required, ...rest }) {
  return (
    <div className="form-field">
      <label className="form-field__label" htmlFor={id}>
        {label} {required ? <span>required</span> : null}
      </label>
      <input
        id={id}
        className="input"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? 'true' : undefined}
        {...rest}
      />
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}