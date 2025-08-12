// Aplicación principal CARVY
class CarvyApp {
    constructor() {
        this.currentScreen = 'login';
        this.currentSection = null;
        this.initializeApp();
    }
    
    // Inicializar aplicación
    initializeApp() {
        this.setupEventListeners();
        this.showScreen('login');
        this.setMinDateTime();
        console.log('🏥 CARVY - Sistema de Gestión Médica iniciado');
    }
    
    // Establecer fecha mínima para inputs datetime-local
    setMinDateTime() {
        const now = new Date();
        const minDateTime = new Date(now.getTime() + (30 * 60000)); // 30 minutos desde ahora
        const minDateTimeString = minDateTime.toISOString().slice(0, 16);
        
        // Actualizar inputs de fecha cuando se muestran los modales
        const observer = new MutationObserver(() => {
            const dateInputs = document.querySelectorAll('input[type="datetime-local"]');
            dateInputs.forEach(input => {
                if (input.name === 'date') {
                    input.min = minDateTimeString;
                }
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    // Configurar event listeners
    setupEventListeners() {
        // Cerrar modales al hacer clic en el overlay
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('show');
                e.target.style.display = 'none';
            }
        });
        
        // Cerrar modales con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal.show');
                if (openModal) {
                    openModal.classList.remove('show');
                    openModal.style.display = 'none';
                }
            }
        });
    }
    
    // Mostrar pantalla
    showScreen(screenName) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.remove('active'));
        
        const targetScreen = document.getElementById(`${screenName}Screen`) || 
                           document.getElementById(`${screenName}Dashboard`);
        
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;
        }
    }
    
    // Mostrar sección específica
    showSection(sectionName) {
        // Actualizar navegación
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => btn.classList.remove('active'));
        
        const activeNavBtn = Array.from(navButtons).find(btn => 
            btn.onclick && btn.onclick.toString().includes(sectionName)
        );
        
        if (activeNavBtn) {
            activeNavBtn.classList.add('active');
        }
        
        // Mostrar sección correspondiente
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => section.classList.remove('active'));
        
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
            
            // Recargar datos específicos de la sección para pacientes
            if (patientManager && patientManager.currentPatient) {
                switch(sectionName) {
                    case 'myAppointments':
                        patientManager.loadUpcomingAppointments();
                        break;
                    case 'myHistory':
                        patientManager.loadPatientHistory();
                        break;
                    case 'myPrescriptionsList':
                        patientManager.loadPatientPrescriptions();
                        break;
                    case 'myProfile':
                        patientManager.loadPatientProfile();
                        break;
                }
            }
        }
    }
}

// Inicialización global
let db, auth, adminManager, doctorManager, patientManager, app;

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Instanciar clases globales
    db = new CarvyDatabase();
    auth = new AuthManager();
    adminManager = new AdminManager();
    doctorManager = new DoctorManager();
    patientManager = new PatientManager();
    app = new CarvyApp();
    
    // Configurar formularios de autenticación
    setupAuthForms();
});

// Configurar formularios de autenticación
function setupAuthForms() {
    // Formulario de registro
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                name: document.getElementById('regName').value,
                email: document.getElementById('regEmail').value,
                password: document.getElementById('regPassword').value,
                type: document.getElementById('regType').value,
                specialty: document.getElementById('specialty').value,
                license: document.getElementById('license').value
            };
            
            const result = auth.register(formData);
            
            if (result.success) {
                showAlert(result.message, 'success');
                registerForm.reset();
                hideSpecialtyFields();
            } else {
                showAlert(result.message, 'error');
            }
        });
        
        // Mostrar/ocultar campos de doctor
        document.getElementById('regType').addEventListener('change', function() {
            if (this.value === 'doctor') {
                showSpecialtyFields();
            } else {
                hideSpecialtyFields();
            }
        });
    }
    
    // Formulario de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            const result = auth.login(email, password);
            
            if (result.success) {
                showAlert(result.message, 'success');
                showDashboard(result.user.role);
                loginForm.reset();
            } else {
                showAlert(result.message, 'error');
            }
        });
    }
}

// Funciones globales para la UI
function showDashboard(role) {
    switch (role) {
        case 'admin':
            app.showScreen('admin');
            adminManager.loadAdminDashboard();
            break;
        case 'doctor':
            app.showScreen('doctor');
            doctorManager.loadDoctorDashboard();
            break;
        case 'patient':
            app.showScreen('patient');
            patientManager.loadPatientDashboard();
            // Mostrar la sección de citas por defecto
            setTimeout(() => app.showSection('myAppointments'), 100);
            break;
        default:
            showAlert('Rol no reconocido', 'error');
            break;
    }
}

function showSection(sectionName) {
    app.showSection(sectionName);
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        // Resetear formulario si existe
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
        
        // Resetear estado de edición
        if (adminManager) {
            adminManager.editingId = null;
            
            // Resetear título del modal
            const modalTitle = modal.querySelector('h3');
            if (modalTitle) {
                const modalType = modalId.replace('add', '').replace('Modal', '').replace('schedule', '').replace('Consultation', '');
                if (modalType === 'Doctor') {
                    modalTitle.textContent = 'Agregar Doctor';
                } else if (modalType === 'Patient') {
                    modalTitle.textContent = 'Agregar Paciente';
                } else if (modalId === 'addConsultationModal') {
                    modalTitle.textContent = 'Agregar Consulta';
                } else if (modalType === 'Prescription') {
                    modalTitle.textContent = 'Agregar Receta';
                } else if (modalId === 'scheduleConsultationModal') {
                    modalTitle.textContent = 'Agendar Nueva Cita';
                }
            }
        }
        
        // Poblar selects si es necesario
        if (modalId === 'addConsultationModal' || modalId === 'addPrescriptionModal') {
            if (adminManager) {
                adminManager.populateSelectOptions();
            }
        }
        
        if (modalId === 'scheduleConsultationModal') {
            if (patientManager) {
                patientManager.populateDoctorsSelect();
            }
        }
        
        modal.classList.add('show');
        modal.style.display = 'flex';
        
        // Focus en el primer input
        const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        
        // Reset form if exists
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
        
        // Reset editing state
        if (adminManager) {
            adminManager.editingId = null;
        }
    }
}

function showAlert(message, type = 'info') {
    // Remover alertas existentes
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    });
    
    // Crear elemento de alerta
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    // Agregar al DOM
    document.body.appendChild(alert);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (alert.parentNode) {
            alert.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.parentNode.removeChild(alert);
                }
            }, 300);
        }
    }, 5000);
    
    // Permitir cerrar haciendo clic
    alert.addEventListener('click', () => {
        if (alert.parentNode) {
            alert.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.parentNode.removeChild(alert);
                }
            }, 300);
        }
    });
}

// Función para acceso de administrador
function adminLogin() {
    auth.adminLogin();
}

// Función para cerrar sesión
function logout() {
    auth.logout();
}

// Funciones de utilidad para la UI
function showSpecialtyFields() {
    const doctorFields = document.getElementById('doctorFields');
    const specialty = document.getElementById('specialty');
    const license = document.getElementById('license');
    
    if (doctorFields) {
        doctorFields.classList.remove('hidden');
    }
    if (specialty) {
        specialty.required = true;
    }
    if (license) {
        license.required = true;
    }
}

function hideSpecialtyFields() {
    const doctorFields = document.getElementById('doctorFields');
    const specialty = document.getElementById('specialty');
    const license = document.getElementById('license');
    
    if (doctorFields) {
        doctorFields.classList.add('hidden');
    }
    if (specialty) {
        specialty.required = false;
        specialty.value = '';
    }
    if (license) {
        license.required = false;
        license.value = '';
    }
}