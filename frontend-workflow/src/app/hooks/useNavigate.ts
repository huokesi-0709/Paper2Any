import { useNav } from '../nav-context';

/**
 * Navigate to a route by path.
 * Wraps the NavProvider's navigate() for convenience in page components.
 */
export function useNavigate() {
  const { navigate } = useNav();

  return (path: string) => {
    navigate(path);
  };
}
