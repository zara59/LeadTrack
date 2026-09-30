/** Shared page title block used by the Leads, Lead details and Settings pages. */
export default function PageHead({ title, subtitle, actions, backLink }) {
  return (
    <div className="page-head">
      <div className="page-head__text">
        {backLink}
        <h1 className="page-head__title">{title}</h1>
        {subtitle ? <p className="page-head__subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="page-head__actions">{actions}</div> : null}
    </div>
  );
}
