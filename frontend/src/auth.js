import AxiosInstance from './components/AxiosInstance';

// Verifica se o token está presente e é válido
export const isAuthenticated = async () => {
  const token = localStorage.getItem('token');
  const loginTimestamp = localStorage.getItem('loginTimestamp');

  if (!token) {
    return false; // Não há token
  }

  // Verifica se o login foi feito há mais de 24 horas (86400000 ms)
  if (loginTimestamp) {
    const isExpired = Date.now() - parseInt(loginTimestamp, 10) > 86400000;
    if (isExpired) {
      logout();
      return false;
    }
  }

  try {
    // Faz uma requisição ao backend para validar o token
    // O AxiosInstance já envia o token no cabeçalho automaticamente
    const response = await AxiosInstance.get('api/validate-token/');

    if (response.status === 200) {
      return true; // Token válido
    } else {
      logout(); // Token inválido
      return false;
    }
  } catch (error) {
    console.error('Erro ao validar token:', error);
    // Se for 401, o AxiosInstance já vai chamar o logout via interceptor
    return false;
  }
};

// Faz logout do usuário
export const logout = () => {
  localStorage.removeItem('token'); // Remove o token do localStorage
  localStorage.removeItem('loginTimestamp'); // Remove o timestamp de login
  window.location.href = '/login'; // Redireciona para a página de login
};