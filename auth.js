// Sistema de autenticación
class AuthManager {
    constructor() {
        this.currentUser = null;
    }
    
    // Registrar nuevo usuario
    register(userData) {
        try {
            const { name, email, password, type, specialty, license } = userData;
            
            // Validaciones
            if (!name || !email || !password || !type) {
                throw new Error('Todos los campos son obligatorios');
            }
            
            if (!db.isValidEmail(email)) {
                throw new Error('El email no es válido');
            }
            
            if (password.length < 6) {
                throw new Error('La contraseña debe tener al menos 6 caracteres');
            }
            
            if (!db.isEmailUnique(email)) {
                throw new Error('Este email ya está registrado');
            }
            
            // Si es doctor, validar campos adicionales
            if (type === 'doctor') {
                if (!specialty || !license) {
                    throw new Error('Especialidad y cédula son requeridas para doctores');
                }
            }
            
            let doctorId = null;
            let patientId = null;
            
            // Si es doctor, crear registro en la tabla de doctores
            if (type === 'doctor') {
                doctorId = db.insert('doctors', {
                    name: db.sanitizeInput(name),
                    email: email.toLowerCase(),
                    specialty: db.sanitizeInput(specialty),
                    license: db.sanitizeInput(license),
                    isActive: true,
                    createdAt: new Date()
                });
            }
            
            // Si es paciente, crear registro en la tabla de pacientes
            if (type === 'patient') {
                patientId = db.insert('patients', {
                    name: db.sanitizeInput(name),
                    email: email.toLowerCase(),
                    phone: '',
                    age: null,
                    isActive: true,
                    createdAt: new Date()
                });
            }
            
            // Crear usuario
            const userId = db.insert('users', {
                name: db.sanitizeInput(name),
                email: email.toLowerCase(),
                password: db.hashPassword(password),
                role: type,
                doctorId: doctorId,
                patientId: patientId,
                isActive: true,
                createdAt: new Date()
            });
            
            // Actualizar el doctor/paciente con el userId
            if (doctorId) {
                db.update('doctors', doctorId, { userId: userId });
            }
            if (patientId) {
                db.update('patients', patientId, { userId: userId });
            }
            
            return {
                success: true,
                message: 'Usuario registrado exitosamente',
                userId: userId
            };
            
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
    
    // Iniciar sesión
    login(email, password) {
        try {
            if (!email || !password) {
                throw new Error('Email y contraseña son requeridos');
            }
            
            const user = db.findOne('users', { email: email.toLowerCase() });
            
            if (!user) {
                throw new Error('Credenciales incorrectas');
            }
            
            if (!user.isActive) {
                throw new Error('La cuenta está desactivada');
            }
            
            if (!db.verifyPassword(password, user.password)) {
                throw new Error('Credenciales incorrectas');
            }
            
            // Actualizar último acceso
            db.update('users', user.id, { lastLogin: new Date() });
            
            this.currentUser = user;
            
            return {
                success: true,
                user: this.getUserData(user),
                message: 'Inicio de sesión exitoso'
            };
            
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
    
    // Login de administrador
    adminLogin() {
        const result = this.login('admin@carvy.com', 'admin123');
        if (result.success) {
            showDashboard('admin');
            return true;
        }
        showAlert('Error de acceso administrativo', 'error');
        return false;
    }
    
    // Cerrar sesión
    logout() {
        this.currentUser = null;
        this.showLoginScreen();
        showAlert('Sesión cerrada exitosamente', 'success');
    }
    
    // Obtener datos del usuario actual
    getCurrentUser() {
        return this.currentUser;
    }
    
    // Verificar si está autenticado
    isAuthenticated() {
        return this.currentUser !== null;
    }
    
    // Verificar rol
    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }
    
    // Obtener datos del usuario para la sesión
    getUserData(user) {
        const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            lastLogin: user.lastLogin
        };
        
        // Agregar datos específicos según el rol
        if (user.role === 'doctor' && user.doctorId) {
            const doctor = db.findById('doctors', user.doctorId);
            if (doctor) {
                userData.doctor = doctor;
                userData.doctorId = user.doctorId;
            }
        }
        
        if (user.role === 'patient' && user.patientId) {
            const patient = db.findById('patients', user.patientId);
            if (patient) {
                userData.patient = patient;
                userData.patientId = user.patientId;
            }
        }
        
        return userData;
    }
    
    // Mostrar pantalla de login
    showLoginScreen() {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.remove('active'));
        document.getElementById('loginScreen').classList.add('active');
    }
    
    // Validar permisos
    validatePermission(requiredRole) {
        if (!this.isAuthenticated()) {
            showAlert('Debes iniciar sesión', 'error');
            this.showLoginScreen();
            return false;
        }
        
        if (!this.hasRole(requiredRole)) {
            showAlert('No tienes permisos para realizar esta acción', 'error');
            return false;
        }
        
        return true;
    }
}