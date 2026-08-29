export const getToken = () => localStorage.getItem('token');

export const setToken = (token) => localStorage.setItem('token', token);

export const removeToken = () => localStorage.removeItem('token');

export const isAuthenticated = () => !!getToken();

export const getUserRole = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user).role : null;
};

export const isAuthorized = (requiredRoles) => {
  const role = getUserRole();
  return requiredRoles.includes(role);
};

export default { getToken, setToken, removeToken, isAuthenticated, getUserRole, isAuthorized };
