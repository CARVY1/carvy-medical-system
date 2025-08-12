// Gestor del panel de paciente
class PatientManager {
    constructor() {
        this.currentPatient = null;
        this.initialized = false;
    }
    
    // Inicializar event listeners (evitar duplicados)
    initializeEventListeners() {
        if (this.initialized) return;
        
        try {
            // Formulario agendar consulta
            const scheduleForm = document.getElementById('scheduleConsultationForm');
            if (scheduleForm) {
                scheduleForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleScheduleConsultation(e);
                });
            }
            
            this.initialized = true;
        } catch (error) {
            console.error('Error al configurar form listeners:', error);
        }
    }
    
    // Cargar citas próximas del paciente
    loadUpcomingAppointments() {
        try {
            const consultations = db.findConsultationsByPatient(this.currentPatient.id);
            const tbody = document.getElementById('upcomingAppointmentsTable');
            
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            // Filtrar y ordenar consultas futuras o pendientes
            const now = new Date();
            const upcomingConsultations = consultations
                .filter(consultation => {
                    const consultationDate = new Date(consultation.date);
                    return consultationDate >= now || consultation.status === 'pending';
                })
                .sort((a, b) => new Date(a.date) - new Date(b.date));
            
            upcomingConsultations.forEach(consultation => {
                const doctor = db.findById('doctors', consultation.doctorId);
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${this.formatDate(consultation.date)}</td>
                    <td>${doctor ? this.escapeHtml(doctor.name) : 'N/A'}</td>
                    <td>${doctor ? this.escapeHtml(doctor.specialty) : 'N/A'}</td>
                    <td>
                        <span class="status-badge status-${consultation.status || 'pending'}">
                            ${this.getStatusText(consultation.status || 'pending')}
                        </span>
                    </td>
                    <td>
                        ${consultation.status === 'pending' ? 
                            `<button class="btn btn-danger btn-small" onclick="patientManager.cancelAppointment(${consultation.id})">
                                Cancelar
                            </button>` : 
                            '<span style="color: #666;">-</span>'
                        }
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            if (upcomingConsultations.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="5" style="text-align: center;">No tienes citas programadas</td>';
                tbody.appendChild(row);
            }
        } catch (error) {
            console.error('Error al cargar citas del paciente:', error);
        }
    }
    
    // Poblar select de doctores
    populateDoctorsSelect() {
        try {
            const select = document.querySelector('#scheduleConsultationModal select[name="doctorId"]');
            if (!select) return;
            
            const doctors = db.getAll('doctors') || [];
            select.innerHTML = '<option value="">Seleccionar Doctor</option>';
            
            doctors.forEach(doctor => {
                select.innerHTML += `<option value="${doctor.id}">${this.escapeHtml(doctor.name)} - ${this.escapeHtml(doctor.specialty)}</option>`;
            });
        } catch (error) {
            console.error('Error al poblar select de doctores:', error);
        }
    }
    
    // Manejar agendar consulta
    handleScheduleConsultation(e) {
        try {
            const formData = new FormData(e.target);
            const data = {
                doctorId: parseInt(formData.get('doctorId')),
                date: new Date(formData.get('date')),
                reason: formData.get('reason')
            };
            
            // Validar datos
            if (!data.doctorId || !data.date || !data.reason) {
                showAlert('Todos los campos son obligatorios', 'error');
                return;
            }
            
            // Validar que la fecha sea futura
            const now = new Date();
            if (data.date <= now) {
                showAlert('La fecha debe ser futura', 'error');
                return;
            }
            
            // Crear nueva consulta como "pendiente"
            const consultationId = db.insert('consultations', {
                doctorId: data.doctorId,
                patientId: this.currentPatient.id,
                date: data.date,
                diagnosis: `Motivo: ${db.sanitizeInput(data.reason)}`,
                status: 'pending'
            });
            
            if (consultationId) {
                showAlert('Cita agendada correctamente', 'success');
                this.loadUpcomingAppointments();
                closeModal('scheduleConsultationModal');
            } else {
                showAlert('Error al agendar la cita', 'error');
            }
            
        } catch (error) {
            console.error('Error al agendar consulta:', error);
            showAlert('Error al procesar la cita', 'error');
        }
    }
    
    // Cancelar cita
    cancelAppointment(consultationId) {
        if (!confirm('¿Estás seguro de cancelar esta cita?')) {
            return;
        }
        
        try {
            const updated = db.update('consultations', consultationId, {
                status: 'cancelled'
            });
            
            if (updated) {
                showAlert('Cita cancelada correctamente', 'success');
                this.loadUpcomingAppointments();
            } else {
                showAlert('Error al cancelar la cita', 'error');
            }
        } catch (error) {
            console.error('Error al cancelar cita:', error);
            showAlert('Error al cancelar la cita', 'error');
        }
    }
    
    // Cargar dashboard de paciente
    loadPatientDashboard() {
        if (!auth.validatePermission('patient')) return;
        
        const currentUser = auth.getCurrentUser();
        if (!currentUser || !currentUser.patientId) {
            showAlert('Error: No se encontró información del paciente', 'error');
            return;
        }
        
        this.currentPatient = db.findById('patients', currentUser.patientId);
        
        if (!this.currentPatient) {
            showAlert('Error: Paciente no encontrado', 'error');
            return;
        }
        
        this.initializeEventListeners();
        this.loadUpcomingAppointments();
        this.loadPatientHistory();
        this.loadPatientPrescriptions();
        this.loadPatientProfile();
    }
    
    // Cargar historial médico del paciente
    loadPatientHistory() {
        try {
            const consultations = db.findConsultationsByPatient(this.currentPatient.id);
            const tbody = document.getElementById('patientHistoryTable');
            
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            // Ordenar consultas por fecha (más recientes primero)
            consultations.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            consultations.forEach(consultation => {
                const doctor = db.findById('doctors', consultation.doctorId);
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${this.formatDate(consultation.date)}</td>
                    <td>${doctor ? this.escapeHtml(doctor.name) : 'N/A'}</td>
                    <td>${this.escapeHtml(consultation.diagnosis)}</td>
                    <td>
                        <span class="status-badge status-${consultation.status || 'completed'}">
                            ${this.getStatusText(consultation.status || 'completed')}
                        </span>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            if (consultations.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="4" style="text-align: center;">No hay historial médico disponible</td>';
                tbody.appendChild(row);
            }
        } catch (error) {
            console.error('Error al cargar historial del paciente:', error);
        }
    }
    
    // Cargar recetas del paciente
    loadPatientPrescriptions() {
        try {
            const prescriptions = db.findPrescriptionsByPatient(this.currentPatient.id);
            const tbody = document.getElementById('patientPrescriptionsTable');
            
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            // Ordenar recetas por fecha (más recientes primero)
            prescriptions.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            prescriptions.forEach(prescription => {
                const doctor = db.findById('doctors', prescription.doctorId);
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${this.formatDate(prescription.date)}</td>
                    <td>${doctor ? this.escapeHtml(doctor.name) : 'N/A'}</td>
                    <td>${this.escapeHtml(prescription.medication)}</td>
                    <td>${this.escapeHtml(prescription.instructions)}</td>
                `;
                tbody.appendChild(row);
            });
            
            if (prescriptions.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="4" style="text-align: center;">No hay recetas médicas disponibles</td>';
                tbody.appendChild(row);
            }
        } catch (error) {
            console.error('Error al cargar recetas del paciente:', error);
        }
    }
    
    // Cargar perfil del paciente
    loadPatientProfile() {
        try {
            const profileDiv = document.getElementById('profileInfo');
            
            if (!profileDiv) return;
            
            const currentUser = auth.getCurrentUser();
            
            profileDiv.innerHTML = `
                <div class="profile-info">
                    <div class="profile-field">
                        <label>Nombre Completo:</label>
                        <span>${this.escapeHtml(this.currentPatient.name)}</span>
                    </div>
                    <div class="profile-field">
                        <label>Email:</label>
                        <span>${this.escapeHtml(this.currentPatient.email)}</span>
                    </div>
                    <div class="profile-field">
                        <label>Teléfono:</label>
                        <span>${this.escapeHtml(this.currentPatient.phone || 'No especificado')}</span>
                    </div>
                    <div class="profile-field">
                        <label>Edad:</label>
                        <span>${this.currentPatient.age ? this.currentPatient.age + ' años' : 'No especificada'}</span>
                    </div>
                    <div class="profile-field">
                        <label>Fecha de Registro:</label>
                        <span>${this.formatDate(this.currentPatient.createdAt)}</span>
                    </div>
                    <div class="profile-field">
                        <label>Último Acceso:</label>
                        <span>${currentUser.lastLogin ? this.formatDate(currentUser.lastLogin) : 'Primera vez'}</span>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error al cargar perfil del paciente:', error);
        }
    }
    
    // Obtener texto del estado
    getStatusText(status) {
        const statusTexts = {
            'completed': 'Completada',
            'pending': 'Pendiente',
            'cancelled': 'Cancelada',
            'active': 'Activa',
            'dispensed': 'Dispensada',
            'expired': 'Expirada'
        };
        
        return statusTexts[status] || status;
    }
    
    // Utilidades
    escapeHtml(unsafe) {
        if (unsafe === null || unsafe === undefined) return '';
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    formatDate(dateString) {
        try {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Fecha inválida';
        }
    }
}