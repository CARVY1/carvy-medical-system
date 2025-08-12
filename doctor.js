// Gestor del panel de doctor
class DoctorManager {
    constructor() {
        this.currentDoctor = null;
    }
    
    // Cargar dashboard de doctor
    loadDoctorDashboard() {
        if (!auth.validatePermission('doctor')) return;
        
        const currentUser = auth.getCurrentUser();
        if (!currentUser || !currentUser.doctorId) {
            showAlert('Error: No se encontró información del doctor', 'error');
            return;
        }
        
        this.currentDoctor = db.findById('doctors', currentUser.doctorId);
        
        if (!this.currentDoctor) {
            showAlert('Error: Doctor no encontrado', 'error');
            return;
        }
        
        this.loadDoctorPatients();
        this.loadDoctorConsultations();
        this.loadDoctorPrescriptions();
    }
    
    // Cargar pacientes del doctor
    loadDoctorPatients() {
        try {
            const patients = db.findPatientsByDoctor(this.currentDoctor.id);
            const tbody = document.getElementById('doctorPatientsTable');
            
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            patients.forEach(patient => {
                // Buscar última consulta del paciente con este doctor
                const consultations = db.find('consultations', {
                    doctorId: this.currentDoctor.id,
                    patientId: patient.id
                });
                
                const lastConsultation = consultations.length > 0 ? 
                    consultations.sort((a, b) => new Date(b.date) - new Date(a.date))[0] : null;
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${this.escapeHtml(patient.name)}</td>
                    <td>${this.escapeHtml(patient.email)}</td>
                    <td>${this.escapeHtml(patient.phone || 'N/A')}</td>
                    <td>${lastConsultation ? this.formatDate(lastConsultation.date) : 'Sin consultas'}</td>
                `;
                tbody.appendChild(row);
            });
            
            if (patients.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="4" style="text-align: center;">No hay pacientes asignados</td>';
                tbody.appendChild(row);
            }
        } catch (error) {
            console.error('Error al cargar pacientes del doctor:', error);
        }
    }
    
    // Cargar consultas del doctor
    loadDoctorConsultations() {
        try {
            const consultations = db.findConsultationsByDoctor(this.currentDoctor.id);
            const tbody = document.getElementById('doctorConsultationsTable');
            
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            // Ordenar consultas por fecha (más recientes primero)
            consultations.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            consultations.forEach(consultation => {
                const patient = db.findById('patients', consultation.patientId);
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${patient ? this.escapeHtml(patient.name) : 'N/A'}</td>
                    <td>${this.formatDate(consultation.date)}</td>
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
                row.innerHTML = '<td colspan="4" style="text-align: center;">No hay consultas realizadas</td>';
                tbody.appendChild(row);
            }
        } catch (error) {
            console.error('Error al cargar consultas del doctor:', error);
        }
    }
    
    // Cargar recetas del doctor
    loadDoctorPrescriptions() {
        try {
            const prescriptions = db.findPrescriptionsByDoctor(this.currentDoctor.id);
            const tbody = document.getElementById('doctorPrescriptionsTable');
            
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            // Ordenar recetas por fecha (más recientes primero)
            prescriptions.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            prescriptions.forEach(prescription => {
                const patient = db.findById('patients', prescription.patientId);
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${patient ? this.escapeHtml(patient.name) : 'N/A'}</td>
                    <td>${this.escapeHtml(prescription.medication)}</td>
                    <td>${this.formatDate(prescription.date)}</td>
                    <td>
                        <span class="status-badge status-${prescription.status || 'active'}">
                            ${this.getStatusText(prescription.status || 'active')}
                        </span>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            if (prescriptions.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="4" style="text-align: center;">No hay recetas emitidas</td>';
                tbody.appendChild(row);
            }
        } catch (error) {
            console.error('Error al cargar recetas del doctor:', error);
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