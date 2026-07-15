import { useState, useCallback } from 'react';
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';
import GardenForm from './components/GardenForm';
import ResultsSection from './components/ResultsSection';
import HistoryPanel from './components/HistoryPanel';
import ImageDesignPage from './components/ImageDesignPage';
import LoadingOverlay from './components/LoadingOverlay';
import NotificationContainer from './components/Notification';
import { useNotifications } from './hooks/useNotifications';
import { useAuth } from './hooks/useAuth';
import { useGardenForm } from './hooks/useGardenForm';
import { useGemini } from './hooks/useGemini';
import { useDesignHistory } from './hooks/useDesignHistory';

function App() {
  // Auth
  const auth = useAuth();

  // Views: 'form' | 'history' | 'results' | 'imageDesign'
  const [activeView, setActiveView] = useState('form');
  const [designNameForResults, setDesignNameForResults] = useState('');
  const [isLoadedDesign, setIsLoadedDesign] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentDesignId, setCurrentDesignId] = useState(null);
  // Token que cambia al generar/cargar un diseño. Sirve como `key` de
  // <ResultsSection> para resetear su estado interno (edición, cantidades).
  const [resultsToken, setResultsToken] = useState(0);

  const form = useGardenForm();
  const gemini = useGemini();
  const history = useDesignHistory();
  const { notifications, addNotification } = useNotifications();

  // Loading message
  const loadingMessage = submitting
    ? (form.uploadedImages.length > 0
      ? 'Analizando imagenes con IA y generando propuestas...'
      : 'Generando tus propuestas personalizadas...')
    : '';

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    const gardenData = form.getFormData();
    const name = form.designName;

    setSubmitting(true);

    try {
      const { proposals, imagesBase64 } = await gemini.generateProposals(form.uploadedImages, gardenData);

      // Build comparison data
      const comparisonData = {
        sustainable: proposals.sustainable,
        aesthetic: proposals.aesthetic
      };

      // Save via backend API (reutiliza las imágenes ya convertidas a base64)
      try {
        const designId = await history.saveCurrentDesign(
          name, gardenData, proposals, comparisonData, imagesBase64
        );
        if (designId) {
          setCurrentDesignId(designId);
          addNotification(`Diseño guardado como: ${name}`, 'success');
        }
      } catch (saveError) {
        addNotification(`Error al guardar: ${saveError.message}`, 'error');
      }

      setDesignNameForResults(name);
      setIsLoadedDesign(false);
      setResultsToken(t => t + 1);
      setActiveView('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      addNotification(`IA no disponible. Usando modo local: ${error.message}`, 'error');
      try {
        await gemini.generateLocalFallback(gardenData);
        setDesignNameForResults(name);
        setIsLoadedDesign(false);
        setResultsToken(t => t + 1);
        setActiveView('results');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (localError) {
        addNotification(`Error en modo local: ${localError.message}`, 'error');
      }
    } finally {
      setSubmitting(false);
    }
  }, [form, gemini, history, addNotification]);

  // Handle loading a design from history
  const handleLoadDesign = useCallback(async (designId) => {
    try {
      const design = await history.loadDesign(designId);

      const proposals = {
        sustainable: design.proposal_sustainable,
        aesthetic: design.proposal_aesthetic
      };

      gemini.resetProposals();
      gemini.setProposalsDirectly(proposals);
      setDesignNameForResults(design.name);
      setIsLoadedDesign(true);
      setCurrentDesignId(designId);
      setResultsToken(t => t + 1);
      setActiveView('results');

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      addNotification(`Error al cargar diseño: ${error.message}`, 'error');
    }
  }, [history, gemini, addNotification]);

  // Handle reset
  const handleReset = useCallback(() => {
    form.reset();
    gemini.resetProposals();
    setActiveView('form');
    setIsLoadedDesign(false);
    setCurrentDesignId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [form, gemini]);

  // Handle editing proposals (quantity changes, deletions)
  const handleUpdateProposals = useCallback(async (updatedProposals) => {
    if (gemini.proposals) {
      gemini.setProposalsDirectly(updatedProposals);
    }

    if (currentDesignId) {
      try {
        await history.updateDesignProposals(currentDesignId, updatedProposals);
        addNotification('Cambios guardados correctamente', 'success');
      } catch (err) {
        addNotification(`Error al guardar cambios: ${err.message}`, 'error');
      }
    }
  }, [gemini, currentDesignId, history, addNotification]);

  // Sidebar navigation
  const handleNavigate = useCallback((view) => {
    if (view === 'form') {
      handleReset();
    } else {
      setActiveView(view);
    }
  }, [handleReset]);

  // Determine which proposals to show
  const currentProposals = gemini.proposals || null;

  // --- Auth loading state ---
  if (auth.loading) {
    return <LoadingOverlay visible={true} message="Comprobando sesión..." />;
  }

  // --- Not authenticated: show login ---
  if (!auth.isAuthenticated) {
    return (
      <AuthPage
        onSignIn={auth.signIn}
        onSignUp={auth.signUp}
        loading={auth.loading}
        error={auth.error}
      />
    );
  }

  // --- Authenticated: show app ---
  return (
    <>
      <Sidebar
        activeView={activeView}
        onNavigate={handleNavigate}
        userEmail={auth.user?.email}
        onSignOut={auth.signOut}
      />

      <div className="main-content">
        <div className="content-area">
          {activeView === 'form' && (
            <GardenForm
              form={form}
              onSubmit={handleSubmit}
              submitting={submitting}
              onNotify={addNotification}
            />
          )}

          {activeView === 'history' && (
            <HistoryPanel
              history={history}
              onClose={() => setActiveView('form')}
              onLoadDesign={handleLoadDesign}
            />
          )}

          {activeView === 'results' && currentProposals && (
            <ResultsSection
              key={resultsToken}
              proposals={currentProposals}
              designName={designNameForResults}
              isLoaded={isLoadedDesign}
              onReset={handleReset}
              onUpdateProposals={handleUpdateProposals}
            />
          )}

          {activeView === 'imageDesign' && (
            <ImageDesignPage />
          )}
        </div>
      </div>

      <aside className="right-panel">
        <div className="right-panel-decoration">
          <div className="right-panel-leaf">🌿</div>
          <div className="right-panel-leaf">🍃</div>
          <div className="right-panel-leaf">🌱</div>
        </div>
      </aside>

      <LoadingOverlay
        visible={submitting || history.loading}
        message={loadingMessage}
      />

      <NotificationContainer notifications={notifications} />
    </>
  );
}

export default App;
