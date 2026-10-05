export default function TeacherFormFields({ prefix, values, onChange, classes, emailRequired = false, disabled = false }) {
    return <section className="dialog-form-panel">
        <h3>Name und Kontakt</h3>
        <fieldset className="manage-dialog-form-grid teacher-form-fields" disabled={disabled}>
            <div><label className="form-label" htmlFor={`${prefix}-vorname`}>Vorname:</label>
                <input id={`${prefix}-vorname`} className="form-input" type="text" name="vorname" value={values.vorname || ''} onChange={event => onChange('vorname', event.target.value)} required autoComplete="given-name" /></div>
            <div><label className="form-label" htmlFor={`${prefix}-nachname`}>Nachname:</label>
                <input id={`${prefix}-nachname`} className="form-input" type="text" name="nachname" value={values.nachname || ''} onChange={event => onChange('nachname', event.target.value)} required autoComplete="family-name" /></div>
            <div><label className="form-label" htmlFor={`${prefix}-klasse`}>Klasse:</label>
                <select id={`${prefix}-klasse`} className="form-select" name="klasse" value={values.klasse || ''} onChange={event => onChange('klasse', event.target.value)}>
                    <option value="">Keine Klasse zugeordnet</option>
                    {classes.map(name => <option key={name} value={name}>{name}</option>)}
                </select></div>
            <div><label className="form-label" htmlFor={`${prefix}-email`}>E-Mail Adresse:</label>
                <input id={`${prefix}-email`} className="form-input" type="email" name="email" value={values.email || ''} onChange={event => onChange('email', event.target.value)} placeholder="name@schule.de" required={emailRequired} autoComplete="email" /></div>
        </fieldset>
    </section>;
}
