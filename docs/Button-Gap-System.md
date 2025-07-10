# Button Group Gap System

## Übersicht

Das neue Button Group Gap System passt automatisch den Abstand zwischen Buttons basierend auf ihrer Anzahl an, um ein ausgewogenes und visuell ansprechendes Layout zu gewährleisten.

## Automatische Gap-Anpassung

### Dialog Actions (BaseDialog)

Das BaseDialog-System wendet automatisch die richtigen Gap-Klassen an:

```javascript
// Automatisch angewendete CSS-Klassen:
.dialog-actions-count-1  // gap: 0
.dialog-actions-count-2  // gap: 2rem
.dialog-actions-count-3  // gap: 1.5rem  
.dialog-actions-count-4  // gap: 1rem
.dialog-actions-count-5  // gap: 0.5rem (5+ buttons)
```

### Button Groups

Für reguläre Button-Gruppen stehen verschiedene Optionen zur Verfügung:

#### 1. CSS :has() Selector (Modern Browsers)
```css
.btn-group-center:has(.btn:nth-child(2):nth-last-child(1)) {
  gap: 2rem; /* Automatisch für 2 buttons */
}
```

#### 2. Manuelle Gap-Klassen
```html
<div class="btn-group-center btn-group-gap-xl">
  <button class="btn">Button 1</button>
  <button class="btn">Button 2</button>
</div>
```

#### 3. JavaScript Utility
```javascript
import { applyAdaptiveButtonGap } from './utils/buttonGapUtils';

// Automatische Anwendung
applyAdaptiveButtonGap(buttonGroupElement);
```

## Gap-Größen

| Button-Anzahl | Gap-Größe | CSS-Klasse | Verwendung |
|---------------|-----------|------------|------------|
| 1 Button      | 0         | `btn-group-gap-none` | Kein Gap notwendig |
| 2 Buttons     | 2rem      | `btn-group-gap-2xl`  | Klare Links/Rechts-Trennung |
| 3 Buttons     | 1.5rem    | `btn-group-gap-xl`   | Links-Mitte-Rechts Balance |
| 4 Buttons     | 1rem      | `btn-group-gap-lg`   | Kompakter, aber lesbar |
| 5+ Buttons    | 0.5rem    | `btn-group-gap-sm`   | Minimaler Gap für viele Buttons |

## Verfügbare Gap-Klassen

```css
.btn-group-gap-none  /* 0 */
.btn-group-gap-xs    /* 0.25rem */
.btn-group-gap-sm    /* 0.5rem */
.btn-group-gap-md    /* 0.75rem */
.btn-group-gap-lg    /* 1rem */
.btn-group-gap-xl    /* 1.5rem */
.btn-group-gap-2xl   /* 2rem */
```

## Responsive Verhalten

Auf schmalen Bildschirmen (< 768px):
- Alle Gaps werden reduziert
- Buttons stapeln sich vertikal
- Optimierung für Touch-Bedienung

```css
@media (max-width: 768px) {
    .btn-group-center,
    .dialog-actions-distributed {
        flex-direction: column;
        gap: 0.5rem !important;
    }
}
```

## Praktische Beispiele

### 1. Dialog mit 2 Actions
```javascript
const actions = [
    { label: 'Abbrechen' },
    { label: 'Speichern', variant: 'success' }
];
// Automatisch: 2rem Gap für klare Trennung
```

### 2. Dialog mit 3 Actions 
```javascript
const actions = [
    { label: 'Zurück' },
    { label: 'Überspringen' },
    { label: 'Weiter', variant: 'primary' }
];
// Automatisch: 1.5rem Gap für Links-Mitte-Rechts
```

### 3. Setup-Seite mit vielen Actions
```javascript
const actions = [
    { label: 'Import' },
    { label: 'Export' },
    { label: 'Löschen' },
    { label: 'Sicherung' },
    { label: 'Einstellungen' }
];
// Automatisch: 0.5rem Gap für kompaktes Layout
```

## Best Practices

### ✅ Do:
- Verwenden Sie das automatische System für Dialog-Actions
- Nutzen Sie `btn-group-center` für zentrierte Button-Gruppen
- Lassen Sie das System die Gap-Größe basierend auf Button-Anzahl wählen
- Testen Sie das Layout auf verschiedenen Bildschirmgrößen

### ❌ Don't:
- Überschreiben Sie nicht die automatischen Gap-Werte ohne guten Grund
- Verwenden Sie keine zu großen Gaps bei vielen Buttons
- Vergessen Sie nicht die mobile Optimierung

## Migration von bestehenden Button-Gruppen

### Vorher:
```html
<div class="btn-group">
  <button class="btn">Button 1</button>
  <button class="btn">Button 2</button>
</div>
```

### Nachher:
```html
<div class="btn-group-center">
  <button class="btn">Button 1</button>
  <button class="btn">Button 2</button>
</div>
<!-- Automatisch: 2rem Gap für 2 Buttons -->
```

## JavaScript Integration

### Automatische Initialisierung
```javascript
import { setupAdaptiveButtonGaps } from './utils/buttonGapUtils';

// Beim Laden der Seite
document.addEventListener('DOMContentLoaded', () => {
    setupAdaptiveButtonGaps();
});
```

### React Integration
```javascript
import { useAdaptiveButtonGaps } from './utils/buttonGapUtils';

const MyComponent = ({ buttons }) => {
    useAdaptiveButtonGaps([buttons]); // Neuberechnung bei Änderung
    
    return (
        <div className="btn-group-center">
            {buttons.map(btn => <button key={btn.id} className="btn">{btn.label}</button>)}
        </div>
    );
};
```

## Browser-Unterstützung

- **CSS :has() Selector**: Chrome 105+, Firefox 121+, Safari 15.4+
- **JavaScript Fallback**: Alle modernen Browser
- **Manuelle Klassen**: Alle Browser
