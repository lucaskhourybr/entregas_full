// Lista de usuários e senhas armazenadas
const usuarios = [
    { email: "admin@admin", senha: "admin" },
    { email: "admin1@admin", senha: "admin" },
    { email: "admin2@admin", senha: "admin" }
];

// Função para verificar se o email e a senha correspondem a um usuário
function validarLogin(email, senha) {
    // Buscar o usuário na lista
    const usuario = usuarios.find(u => u.email === email && u.senha === senha);
    return usuario; // Retorna o usuário se encontrado, ou undefined se não encontrado
}
