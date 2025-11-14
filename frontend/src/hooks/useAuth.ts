export const useAuth = () => {
  const token = localStorage.getItem("access_token");
  const isAuthenticated = !!token;

  const logout = () => {
    localStorage.removeItem("access_token");
    window.location.href = "/auth";
  };

  return { token, isAuthenticated, logout };
};
