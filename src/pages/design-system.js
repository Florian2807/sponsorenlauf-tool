import React, { useState, useRef } from 'react';
import { 
  Button, 
  Input, 
  Card, 
  CardHeader, 
  CardBody, 
  CardFooter,
  Badge, 
  Spinner, 
  Alert, 
  Select,
  Checkbox,
  Switch,
  Modal,
  ModalBody,
  ModalFooter
} from '../components/ui';

export default function StyleGuide() {
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const [checked, setChecked] = useState(false);
  const [switchValue, setSwitchValue] = useState(false);
  const modalRef = useRef(null);

  const options = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3' },
  ];

  return (
    <div className="page-container-extra-wide" style={{ textAlign: 'left' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '3rem' }}>
        <h1 className="page-title">
          <i className="fas fa-palette" aria-hidden="true"></i>
          Design System & Komponenten
        </h1>
        <p className="text-center text-muted" style={{ marginTop: '1rem' }}>
          Modernes UI-Design mit Indigo/Violett Farbpalette - Modern & Minimal
        </p>
      </div>

      {/* Color Palette */}
      <Card className="mb-6">
        <CardHeader title="Farbpalette" />
        <CardBody>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            {[
              { name: 'Primary', class: 'bg-primary', color: '#4F46E5' },
              { name: 'Secondary', class: 'bg-secondary', color: '#8B5CF6' },
              { name: 'Success', class: 'bg-success', color: '#10B981' },
              { name: 'Danger', class: 'bg-danger', color: '#EF4444' },
              { name: 'Warning', class: 'bg-warning', color: '#F59E0B' },
              { name: 'Info', class: 'bg-info', color: '#3B82F6' },
            ].map((color) => (
              <div key={color.name} style={{ textAlign: 'center' }}>
                <div 
                  className={color.class}
                  style={{ 
                    height: '80px', 
                    borderRadius: '8px',
                    marginBottom: '0.5rem',
                    border: '1px solid var(--border-color)'
                  }}
                />
                <div className="font-medium">{color.name}</div>
                <div className="text-muted text-sm">{color.color}</div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Buttons */}
      <Card className="mb-6">
        <CardHeader title="Buttons" subtitle="Verschiedene Button-Varianten und Größen" />
        <CardBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Variants */}
            <div>
              <h4 className="text-lg font-semibold mb-3">Varianten</h4>
              <div className="btn-group">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="success">Success</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="warning">Warning</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="outline">Outline</Button>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <h4 className="text-lg font-semibold mb-3">Größen</h4>
              <div className="btn-group" style={{ alignItems: 'center' }}>
                <Button size="sm">Klein</Button>
                <Button size="md">Mittel</Button>
                <Button size="lg">Groß</Button>
                <Button size="xl">Extra Groß</Button>
              </div>
            </div>

            {/* With Icons */}
            <div>
              <h4 className="text-lg font-semibold mb-3">Mit Icons</h4>
              <div className="btn-group">
                <Button variant="primary" icon={<i className="fas fa-plus"></i>}>
                  Hinzufügen
                </Button>
                <Button variant="success" icon={<i className="fas fa-check"></i>}>
                  Bestätigen
                </Button>
                <Button variant="danger" icon={<i className="fas fa-trash"></i>}>
                  Löschen
                </Button>
                <Button variant="outline" icon={<i className="fas fa-download"></i>}>
                  Download
                </Button>
              </div>
            </div>

            {/* States */}
            <div>
              <h4 className="text-lg font-semibold mb-3">Zustände</h4>
              <div className="btn-group">
                <Button disabled>Deaktiviert</Button>
                <Button loading>Lädt...</Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Forms */}
      <Card className="mb-6">
        <CardHeader title="Formulare" subtitle="Input-Felder, Selects und Checkboxen" />
        <CardBody>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div>
              <Input
                label="Name"
                placeholder="Max Mustermann"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                hint="Geben Sie Ihren vollständigen Namen ein"
              />
              
              <Input
                label="E-Mail"
                type="email"
                placeholder="name@beispiel.de"
                success
                hint="E-Mail ist gültig"
              />
              
              <Input
                label="Passwort"
                type="password"
                error="Passwort muss mindestens 8 Zeichen haben"
              />
            </div>

            <div>
              <Select
                label="Auswahl"
                options={options}
                value={selectValue}
                onChange={(e) => setSelectValue(e.target.value)}
                placeholder="Bitte wählen..."
                hint="Wählen Sie eine Option aus"
              />

              <Checkbox
                label="Nutzungsbedingungen akzeptieren"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
              />

              <Switch
                label="Benachrichtigungen aktivieren"
                checked={switchValue}
                onChange={(e) => setSwitchValue(e.target.checked)}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Badges */}
      <Card className="mb-6">
        <CardHeader title="Badges & Tags" />
        <CardBody>
          <div className="btn-group">
            <Badge variant="primary">Primary</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="success">Aktiv</Badge>
            <Badge variant="danger">Fehler</Badge>
            <Badge variant="warning">Warnung</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="muted">Muted</Badge>
          </div>
        </CardBody>
      </Card>

      {/* Alerts */}
      <Card className="mb-6">
        <CardHeader title="Benachrichtigungen & Alerts" />
        <CardBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Alert variant="success">
              Operation erfolgreich abgeschlossen!
            </Alert>
            <Alert variant="error">
              Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.
            </Alert>
            <Alert variant="warning">
              Achtung: Diese Aktion kann nicht rückgängig gemacht werden.
            </Alert>
            <Alert variant="info">
              Tipp: Sie können die Tastenkombination Strg+S verwenden.
            </Alert>
          </div>
        </CardBody>
      </Card>

      {/* Spinner */}
      <Card className="mb-6">
        <CardHeader title="Loading States" />
        <CardBody>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <div>
              <Spinner size="sm" />
              <p className="text-sm text-muted" style={{ marginTop: '0.5rem' }}>Klein</p>
            </div>
            <div>
              <Spinner size="md" />
              <p className="text-sm text-muted" style={{ marginTop: '0.5rem' }}>Mittel</p>
            </div>
            <div>
              <Spinner size="lg" />
              <p className="text-sm text-muted" style={{ marginTop: '0.5rem' }}>Groß</p>
            </div>
            <div>
              <Spinner text="Lädt Daten..." />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Modal */}
      <Card className="mb-6">
        <CardHeader title="Modals & Dialoge" />
        <CardBody>
          <Button onClick={() => modalRef.current?.showModal()}>
            Modal öffnen
          </Button>

          <Modal
            ref={modalRef}
            title="Beispiel Modal"
            onClose={() => modalRef.current?.close()}
          >
            <ModalBody>
              <p>Dies ist ein modernes Modal-Fenster mit besserem Design.</p>
              <p>Es verwendet das neue Design-System mit Indigo/Violett Farbpalette.</p>
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" onClick={() => modalRef.current?.close()}>
                Abbrechen
              </Button>
              <Button variant="primary" onClick={() => {
                alert('Bestätigt!');
                modalRef.current?.close();
              }}>
                Bestätigen
              </Button>
            </ModalFooter>
          </Modal>
        </CardBody>
      </Card>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card hover>
          <CardHeader title="Standard Card" />
          <CardBody>
            <p>Dies ist eine Standard-Card mit Hover-Effekt.</p>
          </CardBody>
          <CardFooter>
            <Button size="sm" variant="outline">Mehr erfahren</Button>
          </CardFooter>
        </Card>

        <Card hover>
          <CardHeader title="Card mit Icon" />
          <CardBody>
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <i className="fas fa-rocket" style={{ fontSize: '3rem', color: 'var(--primary-color)' }}></i>
              <p style={{ marginTop: '1rem' }}>Schneller Start</p>
            </div>
          </CardBody>
        </Card>

        <Card hover>
          <CardHeader 
            title="Card mit Badge" 
            actions={<Badge variant="success">Neu</Badge>}
          />
          <CardBody>
            <p>Diese Card hat ein Badge im Header.</p>
          </CardBody>
        </Card>
      </div>

      {/* Typography */}
      <Card className="mb-6">
        <CardHeader title="Typographie" />
        <CardBody>
          <h1 style={{ fontSize: 'var(--font-size-4xl)', marginBottom: '1rem' }}>Heading 1</h1>
          <h2 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: '1rem' }}>Heading 2</h2>
          <h3 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: '1rem' }}>Heading 3</h3>
          <h4 style={{ fontSize: 'var(--font-size-xl)', marginBottom: '1rem' }}>Heading 4</h4>
          <p style={{ fontSize: 'var(--font-size-base)', marginBottom: '1rem' }}>
            Dies ist ein normaler Paragraph mit der Basis-Schriftgröße. Das Design-System verwendet
            eine moderne System-Font-Stack für beste Lesbarkeit.
          </p>
          <p className="text-sm text-muted">
            Dies ist ein kleinerer Text in grauer Farbe für weniger wichtige Informationen.
          </p>
        </CardBody>
      </Card>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '3rem 0', borderTop: '1px solid var(--border-color)' }}>
        <p className="text-muted">
          Modernes Design-System für das Sponsorenlauf Tool
          <br />
          <Badge variant="primary" style={{ marginTop: '1rem' }}>Version 2.0</Badge>
        </p>
      </div>
    </div>
  );
}
