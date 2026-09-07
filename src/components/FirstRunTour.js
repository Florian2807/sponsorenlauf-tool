import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const TOUR_STEPS = [
  {
    route: '/setup',
    title: 'Willkommen beim Sponsorenlauf-Tool',
    description: 'Wir schauen uns jetzt gemeinsam die wichtigsten Seiten an. Mit „Weiter“ wechseln Sie automatisch zum nächsten Bereich.',
    location: ['Einführung'],
    navigationHint: 'Die Einführung kann später unter Admin → Einführung starten erneut geöffnet werden.',
  },
  {
    route: '/setup',
    target: '[data-tour="classes"]',
    title: 'Klassenstruktur',
    description: 'Hier legen Sie zuerst Jahrgänge und Klassen fest. Diese Struktur wird für Importe, Lehrerzuordnungen und Auswertungen verwendet.',
    location: ['Admin', 'Datenbank', 'Klassenstruktur'],
    navigationHint: 'Oben in der Navigation Admin wählen und im Bereich Datenbank auf Klassenstruktur klicken.',
  },
  {
    route: '/setup',
    target: '[data-tour="modules"]',
    title: 'Funktionen und Scan-Schutz',
    description: 'Aktivieren Sie nur die benötigten Module und bestimmen Sie, wie das Tool mit versehentlichen Doppel-Scans umgehen soll.',
    location: ['Admin', 'Einstellungen', 'Module verwalten'],
    navigationHint: 'Oben Admin wählen und unter Einstellungen auf Module verwalten klicken.',
  },
  {
    route: '/manage',
    target: '[data-tour="manage"]',
    title: 'Schüler verwalten',
    description: 'Auf dieser Seite können Sie Schüler suchen, hinzufügen, bearbeiten und Ersatz-Barcodes verwalten. Größere Datenmengen importieren Sie unter Admin.',
    location: ['Schüler verwalten'],
    navigationHint: 'Diese Seite ist direkt über Schüler verwalten in der oberen Navigation erreichbar.',
  },
  {
    route: '/scan',
    target: '[data-tour="scan"]',
    title: 'Runden zählen',
    description: 'Das ist die wichtigste Ansicht am Veranstaltungstag. Ein Barcode-Scanner schreibt die ID in dieses Feld und bestätigt sie normalerweise automatisch mit Enter.',
    location: ['Runden zählen', 'Scanner'],
    navigationHint: 'Diese Seite ist direkt über Runden zählen in der oberen Navigation erreichbar.',
  },
  {
    route: '/show',
    target: '[data-tour="show"]',
    title: 'Schüler anzeigen',
    description: 'Hier können Sie einen Barcode prüfen und die bisherigen Runden ansehen, ohne versehentlich eine neue Runde hinzuzufügen.',
    location: ['Schüler anzeigen', 'Barcode-Suche'],
    navigationHint: 'Diese Seite ist direkt über Schüler anzeigen in der oberen Navigation erreichbar.',
  },
  {
    route: '/statistics',
    target: '[data-tour="statistics"]',
    title: 'Live-Statistiken',
    description: 'Dieses Dashboard zeigt Fortschritt, Teilnahme, Klassenvergleiche und – falls aktiviert – die Spendenentwicklung.',
    location: ['Statistiken', 'Dashboard'],
    navigationHint: 'Diese Seite ist direkt über Statistiken in der oberen Navigation erreichbar.',
  },
  {
    route: '/mails',
    target: '[data-tour="mail"]',
    title: 'E-Mail und SMTP',
    description: 'Wenn Sie das E-Mail-Modul verwenden, richten Sie hier Ihren SMTP-Server ein und versenden anschließend die Klassenergebnisse.',
    location: ['Admin', 'Auswertungen', 'E-Mails versenden'],
    navigationHint: 'Oben Admin wählen und unter Auswertungen auf E-Mails versenden klicken.',
  },
  {
    route: '/setup',
    target: '[data-tour="operations"]',
    title: 'Bereitschaft, Backups und Wartung',
    description: 'Vor dem Lauf prüfen Sie hier Datenbank, Speicher, Scanner und SMTP. Erstellen und laden Sie außerdem Backups direkt über die Weboberfläche herunter.',
    location: ['Admin', 'Einstellungen', 'Bereitschaft, Backups & Wartung'],
    navigationHint: 'Oben Admin wählen und unter Einstellungen das Kontrollzentrum öffnen.',
  },
  {
    route: '/setup',
    title: 'Die Einführung ist abgeschlossen',
    description: 'Alle gezeigten Einstellungen bleiben unter Admin erreichbar. Richten Sie als Nächstes Klassen und Module ein und importieren Sie anschließend Ihre Teilnehmerdaten.',
    location: ['Admin'],
    navigationHint: 'Über Admin erreichen Sie später alle Konfigurations-, Import-, Export- und Wartungsfunktionen.',
  },
];

const getSpotlightRect = (element) => {
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  const padding = 7;
  return {
    left: rect.left - padding,
    top: rect.top - padding,
    width: rect.width + (padding * 2),
    height: rect.height + (padding * 2),
  };
};

const getPopoverPosition = (element, popover) => {
  if (!element) return { centered: true };

  const rect = element.getBoundingClientRect();
  const margin = 16;
  const gap = 18;
  const width = Math.min(380, window.innerWidth - (margin * 2));
  const height = Math.min(popover?.scrollHeight || 420, window.innerHeight - (margin * 2));
  const clampLeft = (left) => Math.max(margin, Math.min(left, window.innerWidth - width - margin));
  const clampTop = (top) => Math.max(margin, Math.min(top, window.innerHeight - height - margin));
  const centeredTop = clampTop(rect.top + (rect.height / 2) - (height / 2));
  const centeredLeft = clampLeft(rect.left + (rect.width / 2) - (width / 2));

  if (window.innerWidth - rect.right >= width + gap) {
    return { centered: false, left: rect.right + gap, top: centeredTop, width };
  }

  if (rect.left >= width + gap) {
    return { centered: false, left: rect.left - width - gap, top: centeredTop, width };
  }

  if (window.innerHeight - rect.bottom >= height + gap) {
    return { centered: false, left: centeredLeft, top: rect.bottom + gap, width };
  }

  if (rect.top >= height + gap) {
    return { centered: false, left: centeredLeft, top: rect.top - height - gap, width };
  }

  return {
    centered: false,
    left: rect.right < window.innerWidth / 2 ? window.innerWidth - width - margin : margin,
    top: margin,
    width,
  };
};

export default function FirstRunTour() {
  const router = useRouter();
  const { authenticated, loading: authLoading } = useAdminAuth();
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState(null);
  const [spotlightRect, setSpotlightRect] = useState(null);
  const [position, setPosition] = useState({ centered: true });
  const [finishing, setFinishing] = useState(false);
  const popoverRef = useRef(null);

  const step = TOUR_STEPS[currentStep];

  useEffect(() => {
    if (active || authLoading || !authenticated || router.pathname === '/admin-login') return;

    let cancelled = false;
    axios.get('/api/setupStatus', { timeout: 5000 }).then(async (response) => {
      const explicitlyStarted = router.query.tour === '1';
      if (cancelled || (response.data?.data?.isSetupCompleted && !explicitlyStarted)) return;
      const requestedStep = Number.parseInt(router.query.step, 10);
      const initialStep = Number.isInteger(requestedStep)
        && requestedStep >= 0
        && requestedStep < TOUR_STEPS.length
        ? requestedStep
        : 0;
      setActive(true);
      setCurrentStep(initialStep);
      if (router.pathname !== TOUR_STEPS[initialStep].route) {
        await router.replace({
          pathname: TOUR_STEPS[initialStep].route,
          query: { tour: '1', step: initialStep },
        });
      }
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [active, authenticated, authLoading, router, router.pathname, router.query.tour]);

  useEffect(() => {
    if (!active || router.pathname !== step.route) return undefined;

    let layoutFrame = null;
    const timer = window.setTimeout(() => {
      const highlightedElement = step.target ? document.querySelector(step.target) : null;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setTargetElement(highlightedElement);
      setSpotlightRect(getSpotlightRect(highlightedElement));
      setPosition(getPopoverPosition(highlightedElement, popoverRef.current));
      layoutFrame = window.requestAnimationFrame(() => {
        setSpotlightRect(getSpotlightRect(highlightedElement));
        setPosition(getPopoverPosition(highlightedElement, popoverRef.current));
      });
    }, 180);

    return () => {
      window.clearTimeout(timer);
      if (layoutFrame) window.cancelAnimationFrame(layoutFrame);
    };
  }, [active, router.pathname, step]);

  useEffect(() => {
    if (!active) return undefined;
    const updatePosition = () => {
      setSpotlightRect(getSpotlightRect(targetElement));
      setPosition(getPopoverPosition(targetElement, popoverRef.current));
    };
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [active, targetElement]);

  const goToStep = useCallback(async (nextStep) => {
    const boundedStep = Math.max(0, Math.min(nextStep, TOUR_STEPS.length - 1));
    setTargetElement(null);
    setSpotlightRect(null);
    setPosition({ centered: true });
    setCurrentStep(boundedStep);
    const nextRoute = TOUR_STEPS[boundedStep].route;
    await router.push({
      pathname: nextRoute,
      query: { tour: '1', step: boundedStep },
    }, undefined, { shallow: router.pathname === nextRoute });
  }, [router]);

  const finishTour = useCallback(async () => {
    setFinishing(true);
    try {
      await axios.post('/api/setupStatus');
      setActive(false);
      await router.push('/setup');
    } finally {
      setFinishing(false);
    }
  }, [router]);

  const popoverStyle = useMemo(() => (
    position.centered
      ? undefined
      : { left: `${position.left}px`, top: `${position.top}px`, width: `${position.width}px` }
  ), [position]);

  const spotlightStyle = useMemo(() => (spotlightRect ? {
    left: `${spotlightRect.left}px`,
    top: `${spotlightRect.top}px`,
    width: `${spotlightRect.width}px`,
    height: `${spotlightRect.height}px`,
  } : undefined), [spotlightRect]);

  if (!active || router.pathname !== step.route) return null;

  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  return (
    <div className="first-run-tour" aria-live="polite">
      {spotlightRect ? (
        <div className="first-run-tour-spotlight" style={spotlightStyle} aria-hidden="true" />
      ) : (
        <div className="first-run-tour-backdrop" />
      )}
      <section
        ref={popoverRef}
        className={`first-run-tour-popover ${position.centered ? 'first-run-tour-popover--centered' : ''}`}
        style={popoverStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="first-run-tour-title"
      >
        <div className="first-run-tour-progress">Schritt {currentStep + 1} von {TOUR_STEPS.length}</div>
        <div className="first-run-tour-location">
          <span>Sie sind hier</span>
          <div className="first-run-tour-breadcrumb" aria-label={`Aktueller Bereich: ${step.location.join(', ')}`}>
            {step.location.map((item, index) => (
              <span key={`${item}-${index}`}>
                {index > 0 && <span className="first-run-tour-breadcrumb-separator" aria-hidden="true">›</span>}
                <strong>{item}</strong>
              </span>
            ))}
          </div>
        </div>
        <h2 id="first-run-tour-title">{step.title}</h2>
        <p>{step.description}</p>
        <div className="first-run-tour-navigation-hint">
          <strong>So kommen Sie später hierher:</strong>
          <span>{step.navigationHint}</span>
        </div>
        <div className="first-run-tour-actions">
          <button type="button" className="btn btn-secondary" onClick={finishTour} disabled={finishing}>
            Überspringen
          </button>
          <div>
            {currentStep > 0 && (
              <button type="button" className="btn btn-secondary" onClick={() => goToStep(currentStep - 1)}>
                Zurück
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary"
              onClick={isLastStep ? finishTour : () => goToStep(currentStep + 1)}
              disabled={finishing}
            >
              {finishing ? 'Bitte warten…' : isLastStep ? 'Tour beenden' : 'Weiter'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
