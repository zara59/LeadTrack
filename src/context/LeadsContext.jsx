import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import LeadModal from '../components/LeadModal.jsx';
import { useAuth } from './AuthContext.jsx';
import * as leadService from '../services/leads.js';
import { fetchDashboardStats } from '../services/dashboard.js';

const LeadsContext = createContext(null);

function listReducer(state, action) {
  switch (action.type) {
    case 'SET':
      return action.leads;
    case 'PREPEND':
      return [action.lead, ...state.filter((lead) => lead.id !== action.lead.id)];
    case 'REPLACE':
      return state.map((lead) => (lead.id === action.lead.id ? action.lead : lead));
    case 'REMOVE':
      return state.filter((lead) => lead.id !== action.id);
    default:
      return state;
  }
}

/**
 * Owns the lead list, dashboard stats and every mutation the user can perform.
 *
 * All data is fetched from (and written back to) the Express/PostgreSQL API.
 * The list + stats live here so the sidebar, dashboard and details page share
 * one source of truth; search/filtering on the Leads page is server-side.
 *
 * The provider also renders the shared Add/Edit dialog and the delete
 * confirmation, so any page can trigger them with a single call.
 */
export default function LeadsProvider({ children }) {
  const { status } = useAuth();
  const [leads, dispatch] = useReducer(listReducer, []);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statsError, setStatsError] = useState(null);
  const [revision, setRevision] = useState(0);
  const [actionError, setActionError] = useState(null);

  const [modal, setModal] = useState({ open: false, lead: null });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const liveRef = useRef(true);
  useEffect(() => {
    liveRef.current = true;
    return () => {
      liveRef.current = false;
    };
  }, []);

  const reloadStats = useCallback(async () => {
    setIsStatsLoading(true);
    setStatsError(null);
    try {
      const data = await fetchDashboardStats();
      if (liveRef.current) setStats(data);
    } catch (err) {
      if (liveRef.current) setStatsError(err.message ?? 'Could not load dashboard statistics.');
    } finally {
      if (liveRef.current) setIsStatsLoading(false);
    }
  }, []);

  const reloadLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await leadService.fetchLeads();
      if (liveRef.current) dispatch({ type: 'SET', leads: data });
    } catch (err) {
      if (liveRef.current) setError(err.message ?? 'Could not load leads.');
    } finally {
      if (liveRef.current) setIsLoading(false);
    }
  }, []);

  const reload = useCallback(() => {
    reloadLeads();
    reloadStats();
  }, [reloadLeads, reloadStats]);

  // Load everything when a session becomes available; drop it when signed out
  // so no stale data survives a logout.
  useEffect(() => {
    if (status === 'authenticated') {
      reload();
    } else {
      dispatch({ type: 'SET', leads: [] });
      setStats(null);
      setError(null);
      setStatsError(null);
    }
  }, [status, reload]);

  const bumpRevision = useCallback(() => setRevision((value) => value + 1), []);

  const createLead = useCallback(
    async (values) => {
      const lead = await leadService.createLead(values);
      if (liveRef.current) {
        dispatch({ type: 'PREPEND', lead });
        bumpRevision();
      }
      reloadStats();
      return lead;
    },
    [reloadStats, bumpRevision],
  );

  const updateLead = useCallback(
    async (id, values) => {
      const lead = await leadService.updateLead(id, values);
      if (liveRef.current) {
        dispatch({ type: 'REPLACE', lead });
        bumpRevision();
      }
      reloadStats();
      return lead;
    },
    [reloadStats, bumpRevision],
  );

  const changeStatus = useCallback(
    async (id, statusValue) => {
      try {
        const lead = await leadService.updateLead(id, { status: statusValue });
        if (liveRef.current) {
          dispatch({ type: 'REPLACE', lead });
          bumpRevision();
        }
        reloadStats();
        return lead;
      } catch (err) {
        // 404 means the row disappeared (e.g. deleted elsewhere) — resync.
        if (err.status === 404) {
          reloadLeads();
          reloadStats();
        } else {
          setActionError(err.message ?? 'Could not update status.');
        }
        throw err;
      }
    },
    [reloadLeads, reloadStats, bumpRevision],
  );

  const deleteLead = useCallback(
    async (id) => {
      await leadService.deleteLead(id);
      if (liveRef.current) {
        dispatch({ type: 'REMOVE', id });
        bumpRevision();
      }
      reloadStats();
      return id;
    },
    [reloadStats, bumpRevision],
  );

  const submitModal = useCallback(
    async (values) => {
      if (modal.lead) {
        return updateLead(modal.lead.id, values);
      }
      return createLead(values);
    },
    [modal.lead, createLead, updateLead],
  );

  const openAdd = useCallback(() => setModal({ open: true, lead: null }), []);
  const openEdit = useCallback((lead) => setModal({ open: true, lead }), []);
  const closeModal = useCallback(() => setModal({ open: false, lead: null }), []);

  const requestDelete = useCallback((lead) => setDeleteTarget(lead), []);
  const cancelDelete = useCallback(() => setDeleteTarget(null), []);
  const confirmDelete = useCallback(
    async (id) => {
      try {
        await deleteLead(id);
        setDeleteTarget(null);
      } catch (err) {
        if (err.status !== 404) {
          setActionError(err.message ?? 'Could not delete the lead.');
        }
        throw err;
      }
    },
    [deleteLead],
  );

  const clearActionError = useCallback(() => setActionError(null), []);

  const value = useMemo(
    () => ({
      leads,
      stats,
      isLoading,
      isStatsLoading,
      error,
      statsError,
      revision,
      actionError,
      reload,
      reloadLeads,
      reloadStats,
      createLead,
      updateLead,
      changeStatus,
      deleteLead,
      submitModal,
      openAdd,
      openEdit,
      closeModal,
      requestDelete,
      cancelDelete,
      confirmDelete,
      clearActionError,
    }),
    [
      leads,
      stats,
      isLoading,
      isStatsLoading,
      error,
      statsError,
      revision,
      actionError,
      reload,
      reloadLeads,
      reloadStats,
      createLead,
      updateLead,
      changeStatus,
      deleteLead,
      submitModal,
      openAdd,
      openEdit,
      closeModal,
      requestDelete,
      cancelDelete,
      confirmDelete,
      clearActionError,
    ],
  );

  return (
    <LeadsContext.Provider value={value}>
      {children}

      <LeadModal
        open={modal.open}
        lead={modal.lead}
        onClose={closeModal}
        onSubmit={submitModal}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        lead={deleteTarget}
        onCancel={cancelDelete}
        onConfirm={() => confirmDelete(deleteTarget?.id)}
      />
    </LeadsContext.Provider>
  );
}

export function useLeads() {
  const context = useContext(LeadsContext);
  if (!context) {
    throw new Error('useLeads must be used inside <LeadsProvider>');
  }
  return context;
}