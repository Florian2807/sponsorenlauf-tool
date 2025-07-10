# BaseDialog - Enhanced Action Layout System

## Übersicht

Die BaseDialog-Komponente wurde erweitert, um automatisch den verfügbaren Platz für Actions (Buttons) basierend auf ihrer Anzahl aufzuteilen.

## Action Layout Modi

### 1. `actionLayout="default"` (Neu: Auto-Distribution)

Verteilt die Buttons automatisch basierend auf ihrer Anzahl:

- **1 Button**: Rechts ausgerichtet
- **2 Buttons**: Links und rechts (space-between)
- **3 Buttons**: Links, Mitte, rechts (space-between mit center)
- **4+ Buttons**: Gleichmäßig verteilt (space-evenly)

```javascript
const actions = [
    { label: 'Abbrechen' },
    { label: 'Speichern', variant: 'success' },
    { label: 'Löschen', variant: 'danger' }
];

<BaseDialog 
    actions={actions} 
    actionLayout="default" // Automatische Verteilung: links, mitte, rechts
/>
```

### 2. `actionLayout="split"` (Bestehend)

Speziell für 2 Buttons mit expliziter Position:

```javascript
const actions = [
    { label: 'Abbrechen', position: 'left' },
    { label: 'Speichern', variant: 'success' } // automatisch rechts
];

<BaseDialog 
    actions={actions} 
    actionLayout="split" // Links/Rechts mit expliziter Kontrolle
/>
```

### 3. `actionLayout="right"` (Bestehend)

Alle Buttons rechts ausgerichtet:

```javascript
<BaseDialog 
    actions={actions} 
    actionLayout="right" // Alle Buttons rechts
/>
```

## Button Varianten

```javascript
const actions = [
    { label: 'Abbrechen' }, // Standard (btn-primary)
    { label: 'Speichern', variant: 'success' }, // Grün
    { label: 'Löschen', variant: 'danger' }, // Rot
    { label: 'Zurück', variant: 'secondary' } // Grau
];
```

## Responsive Verhalten

Auf schmalen Bildschirmen (< 768px):
- Alle Action-Layouts werden automatisch zu einer vertikalen Spalte
- Buttons nehmen die volle Breite ein
- Optimale Touch-Bedienung

## CSS-Klassen

Das System verwendet automatisch diese CSS-Klassen:

- `.dialog-actions-distributed` - Flex-Container für automatische Verteilung
- `.dialog-actions-count-2` - Spezifische Styles für 2 Buttons
- `.dialog-actions-count-3` - Spezifische Styles für 3 Buttons
- `.dialog-actions-count-4` - Spezifische Styles für 4 Buttons
- `.dialog-actions-count-5` - Spezifische Styles für 5+ Buttons

## Beispiele

### Dialog mit 3 Actions (Auto-Distribution)
```javascript
const ExportDialog = () => {
    const actions = [
        { label: 'Schließen' },
        { label: 'Excel Export', variant: 'success' },
        { label: 'PDF Export', variant: 'success' }
    ];

    return (
        <BaseDialog 
            title="Export Optionen"
            actions={actions}
            actionLayout="default" // Links, Mitte, Rechts
        >
            <p>Wählen Sie das Export-Format:</p>
        </BaseDialog>
    );
};
```

### Dialog mit 2 Actions (Split Layout)
```javascript
const ConfirmDialog = () => {
    const actions = [
        { label: 'Abbrechen', position: 'left' },
        { label: 'Löschen', variant: 'danger' }
    ];

    return (
        <BaseDialog 
            title="Bestätigung"
            actions={actions}
            actionLayout="split" // Explizite Links/Rechts Kontrolle
        >
            <p>Möchten Sie dieses Element wirklich löschen?</p>
        </BaseDialog>
    );
};
```

## Migration

Bestehende Dialoge können einfach migriert werden:

### Vorher:
```javascript
actionLayout="split"
actions={[
    { label: 'Button1', position: 'left' },
    { label: 'Button2' },
    { label: 'Button3' }
]}
```

### Nachher:
```javascript
actionLayout="default" // Automatische Verteilung
actions={[
    { label: 'Button1' },
    { label: 'Button2' },
    { label: 'Button3' }
]}
```

Die `position`-Property wird nur noch bei `actionLayout="split"` verwendet.
