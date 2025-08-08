'use client';

import * as React from 'react';

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

type Toast = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive';
};

type State = { toasts: Toast[] };

type Action = 
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'UPDATE_TOAST'; toast: Partial<Toast> }
  | { type: 'DISMISS_TOAST'; toastId?: Toast['id'] }
  | { type: 'REMOVE_TOAST'; toastId?: Toast['id'] };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case 'DISMISS_TOAST':
      const { toastId } = action;

      // ! Side effect ! - This means all toasts will be dismissed after a period of time
      if (toastId) {
        timeouts.delete(toastId);
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId ? { ...t, open: false } : t
        ),
      };
    case 'REMOVE_TOAST':
      if (action.toastId === undefined) {
        return { ...state, toasts: [] };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    default:
      return state;
  }
};

const timeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (timeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    timeouts.delete(toastId);
    dispatch({ type: 'REMOVE_TOAST', toastId: toastId });
  }, TOAST_REMOVE_DELAY);

  timeouts.set(toastId, timeout);
};

const ToastContext = React.createContext<{
  toast: (props: Toast) => { id: string };
  dismiss: (toastId?: string) => void;
  toasts: Toast[];
} | null>(null);

let dispatch: React.Dispatch<Action>;

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, localDispatch] = React.useReducer(reducer, { toasts: [] });

  React.useEffect(() => {
    dispatch = localDispatch;
  }, []);

  React.useEffect(() => {
    state.toasts.forEach((toast) => {
      if (toast.open === false) {
        addToRemoveQueue(toast.id);
      }
    });
  }, [state.toasts]);

  const toast = React.useCallback((props: Toast) => {
    const id = crypto.randomUUID();

    const update = (props: Partial<Toast>) =>
      dispatch({ type: 'UPDATE_TOAST', toast: { ...props, id } });
    const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id });

    dispatch({
      type: 'ADD_TOAST',
      toast: { ...props, id, open: true, dismiss, update },
    });

    return { id };
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss: (toastId) => dispatch({ type: 'DISMISS_TOAST', toastId }), toasts: state.toasts }}>
      {children}
    </ToastContext.Provider>
  );
}

function useToast() {
  const context = React.useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}

export { ToastProvider, useToast };
