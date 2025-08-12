// Gestor del panel de administración
class AdminManager {
    constructor() {
        this.currentSection = 'dashboard';
        this.editingId = null;
        this.initialized = false;
    }
    
    // Inicializar event listeners (evitar duplicados)
    initializeEventListeners() {
        if (this.initialized) return;
        
        try {
            // Formulario agregar doctor
            const addDoctorForm = document.getElementById('addDoctorForm');
            if (addDoctorForm) {
                addDoctorForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleDoctorSubmit(e);
                });
            }
            
            // Formulario agregar paciente
            const addPatientForm = document.getElementById('addPatientForm');
            if (addPatientForm) {
                addPatientForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handlePatientSubmit(e);
                });
            }
            
            // Formulario agregar consulta
            const addConsultationForm = document.getElementById('addConsultationForm');
            if (addConsultationForm) {
                addConsultationForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleConsultationSubmit(e);
                });
            }
            
            // Formulario agregar receta
            const addPrescriptionForm = document.getElementById('addPrescriptionForm');
            if (addPrescriptionForm) {
                addPrescriptionForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handlePrescriptionSubmit(e);
                });
            }
            
            this.initialized = true;
        } catch (error) {
            console.error('Error al configurar form listeners:', error);
        }
    }
    
    // Cargar dashboard de administrador
    loadAdminDashboard() {
        try {
            if (!auth.validatePermission('admin')) {
                return;
            }
            
            this.initializeEventListeners();
            this.loadDashboardStats();
            this.loadDoctorsTable();
            this.loadPatientsTable();
            this.loadConsultationsTable();
            this.loadPrescriptionsTable();
            this.populateSelectOptions();
        } catch (error) {
            console.error('Error al cargar dashboard:', error);
        }
    }
    
    // Cargar estadísticas del dashboard
    loadDashboardStats() {
        try {
            const stats = db.getStats();
            
            const totalDoctorsEl = document.getElementById('totalDoctors');
            const totalPatientsEl = document.getElementById('totalPatients');
            const totalConsultationsEl = document.getElementById('totalConsultations');
            const totalPrescriptionsEl = document.getElementById('totalPrescriptions');
            
            if (totalDoctorsEl) totalDoctorsEl.textContent = stats.totalDoctors;
            if (totalPatientsEl) totalPatientsEl.textContent = stats.totalPatients;
            if (totalConsultationsEl) totalConsultationsEl.textContent = stats.totalConsultations;
            if (totalPrescriptionsEl) totalPrescriptionsEl.textContent = stats.totalPrescriptions;
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        }
    }
    
    // Cargar tabla de doctores
    loadDoctorsTable() {
        try {
            const doctors = db.getAll('doctors') || [];
            const tbody = document.getElementById('doctorsTable');
            
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            doctors.forEach(doctor => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${this.escapeHtml(doctor.id)}</td>
                    <td>${this.escapeHtml(doctor.name)}</td>
                    <td>${this.escapeHtml(doctor.email)}</td>
                    <td>${this.escapeHtml(doctor.specialty)}</td>
                    <td>${this.escapeHtml(doctor.license)}</td>
                    <td>
                        <button class="btn btn-warning btn-small" onclick="adminManager.editDoctor(${doctor.id})">
                            Editar
                        </button>
                        <button class="btn btn-danger btn-small" onclick="adminManager.deleteDoctor(${doctor.id})">
                            Eliminar
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            if (doctors.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="6" style="text-align: center;">No hay doctores registrados</td>';
                tbody.appendChild(row);
            }
        } catch (error) {
            console.error('Error al cargar tabla de doctores:', error);
        }
    }
    
    // Cargar tabla de pacientes
    loadPatientsTable() {
        try {
            const patients = db.getAll('patients') || [];
            const tbody = document.getElementById('patientsTable');
            
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            patients.forEach(patient => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${this.escapeHtml(patient.id)}</td>
                    <td>${this.escapeHtml(patient.name)}</td>
                    <td>${this.escapeHtml(patient.email)}</td>
                    <td>${this.escapeHtml(patient.phone || 'N/A')}</td>
                    <td>${this.escapeHtml(patient.age || 'N/A')}</td>
                    <td>
                        <button class="btn btn-warning btn-small" onclick="adminManager.editPatient(${patient.id})">
                            Editar
                        </button>
                        <button class="btn btn-danger btn-small" onclick="adminManager.deletePatient(${patient.id})">
                            Eliminar
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            if (patients.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="6" style="text-align: center;">No hay pacientes registrados</td>';
                tbody.appendChild(row);
            }
        } catch (error) {
            console.error('Error al cargar tabla de pacientes:', error);
        }
    }
    
    // Cargar tabla de consultas
    loadConsultationsTable() {
        try {
            const consultations = db.getAll('consultations') || [];
            const tbody = document.getElementById('consultationsTable');
            
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            consultations.forEach(consultation => {
                const doctor = db.findById('doctors', consultation.doctorId);
                const patient = db.findById('patients', consultation.patientId);
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${this.escapeHtml(consultation.id)}</td>
                    <td>${this.escapeHtml(doctor ? doctor.name : 'N/A')}</td>
                    <td>${this.escapeHtml(patient ? patient.name : 'N/A')}</td>
                    <td>${this.formatDate(consultation.date)}</td>
                    <td>${this.escapeHtml(consultation.diagnosis)}</td>
                    <td>
                        <button class="btn btn-warning btn-small" onclick="adminManager.editConsultation(${consultation.id})">
                            Editar
                        </button>
                        <button class="btn btn-danger btn-small" onclick="adminManager.deleteConsultation(${consultation.id})">
                            Eliminar
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            if (consultations.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="6" style="text-align: center;">No hay consultas registradas</td>';
                tbody.appendChild(row);
            }
        } catch (error) {
            console.error('Error al cargar tabla de consultas:', error);
        }
    }
    
    // Cargar tabla de recetas
    loadPrescriptionsTable() {
        try {
            const prescriptions = db.getAll('prescriptions') || [];
            const tbody = document.getElementById('prescriptionsTable');
            
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            prescriptions.forEach(prescription => {
                const doctor = db.findById('doctors', prescription.doctorId);
                const patient = db.findById('patients', prescription.patientId);
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${this.escapeHtml(prescription.id)}</td>
                    <td>${this.escapeHtml(doctor ? doctor.name : 'N/A')}</td>
                    <td>${this.escapeHtml(patient ? patient.name : 'N/A')}</td>
                    <td>${this.formatDate(prescription.date)}</td>
                    <td>${this.escapeHtml(prescription.medication)}</td>
                    <td>
                        <button class="btn btn-warning btn-small" onclick="adminManager.editPrescription(${prescription.id})">
                            Editar
                        </button>
                        <button class="btn btn-danger btn-small" onclick="adminManager.deletePrescription(${prescription.id})">
                            Eliminar
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            if (prescriptions.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="6" style="text-align: center;">No hay recetas registradas</td>';
                tbody.appendChild(row);
            }
        } catch (error) {
            console.error('Error al cargar tabla de recetas:', error);
        }
    }
    
    // Poblar opciones de select
    populateSelectOptions() {
        try {
            // Poblar select de doctores
            const doctorSelects = document.querySelectorAll('select[name="doctorId"]');
            doctorSelects.forEach(select => {
                const doctors = db.getAll('doctors') || [];
                select.innerHTML = '<option value="">Seleccionar Doctor</option>';
                doctors.forEach(doctor => {
                    select.innerHTML += `<option value="${doctor.id}">${this.escapeHtml(doctor.name)}</option>`;
                });
            });
            
            // Poblar select de pacientes
            const patientSelects = document.querySelectorAll('select[name="patientId"]');
            patientSelects.forEach(select => {
                const patients = db.getAll('patients') || [];
                select.innerHTML = '<option value="">Seleccionar Paciente</option>';
                patients.forEach(patient => {
                    select.innerHTML += `<option value="${patient.id}">${this.escapeHtml(patient.name)}</option>`;
                });
            });
        } catch (error) {
            console.error('Error al poblar selects:', error);
        }
    }
    
    // Manejar envío de doctor
    handleDoctorSubmit(e) {
        try {
            const formData = new FormData(e.target);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                specialty: formData.get('specialty'),
                license: formData.get('license')
            };
            
            // Validar datos
            if (!data.name || !data.email || !data.specialty || !data.license) {
                showAlert('Todos los campos son obligatorios', 'error');
                return;
            }
            
            if (!db.isValidEmail(data.email)) {
                showAlert('El email no es válido', 'error');
                return;
            }
            
            // Verificar email único
            const existingDoctor = db.findOne('doctors', { email: data.email });
            if (existingDoctor && (!this.editingId || existingDoctor.id !== parseInt(this.editingId))) {
                showAlert('Este email ya está registrado', 'error');
                return;
            }
            
            if (this.editingId) {
                // Editar doctor existente
                const updated = db.update('doctors', this.editingId, {
                    name: db.sanitizeInput(data.name),
                    email: data.email.toLowerCase(),
                    specialty: db.sanitizeInput(data.specialty),
                    license: db.sanitizeInput(data.license)
                });
                
                if (updated) {
                    showAlert('Doctor actualizado correctamente', 'success');
                } else {
                    showAlert('Error al actualizar doctor', 'error');
                }
            } else {
                // Crear nuevo doctor
                const doctorId = db.insert('doctors', {
                    name: db.sanitizeInput(data.name),
                    email: data.email.toLowerCase(),
                    specialty: db.sanitizeInput(data.specialty),
                    license: db.sanitizeInput(data.license),
                    isActive: true
                });
                
                showAlert('Doctor agregado correctamente', 'success');
            }
            
            // Recargar tabla y cerrar modal
            this.loadDoctorsTable();
            this.loadDashboardStats();
            this.populateSelectOptions();
            closeModal('addDoctorModal');
            this.editingId = null;
            
        } catch (error) {
            console.error('Error al manejar doctor:', error);
            showAlert('Error al procesar la información', 'error');
        }
    }
    
    // Manejar envío de paciente
    handlePatientSubmit(e) {
        try {
            const formData = new FormData(e.target);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                age: parseInt(formData.get('age'))
            };
            
            // Validar datos
            if (!data.name || !data.email || !data.phone || !data.age) {
                showAlert('Todos los campos son obligatorios', 'error');
                return;
            }
            
            if (!db.isValidEmail(data.email)) {
                showAlert('El email no es válido', 'error');
                return;
            }
            
            if (data.age < 1 || data.age > 120) {
                showAlert('La edad debe ser entre 1 y 120 años', 'error');
                return;
            }
            
            // Verificar email único
            const existingPatient = db.findOne('patients', { email: data.email });
            if (existingPatient && (!this.editingId || existingPatient.id !== parseInt(this.editingId))) {
                showAlert('Este email ya está registrado', 'error');
                return;
            }
            
            if (this.editingId) {
                // Editar paciente existente
                const updated = db.update('patients', this.editingId, {
                    name: db.sanitizeInput(data.name),
                    email: data.email.toLowerCase(),
                    phone: db.sanitizeInput(data.phone),
                    age: data.age
                });
                
                if (updated) {
                    showAlert('Paciente actualizado correctamente', 'success');
                } else {
                    showAlert('Error al actualizar paciente', 'error');
                }
            } else {
                // Crear nuevo paciente
                const patientId = db.insert('patients', {
                    name: db.sanitizeInput(data.name),
                    email: data.email.toLowerCase(),
                    phone: db.sanitizeInput(data.phone),
                    age: data.age,
                    isActive: true
                });
                
                showAlert('Paciente agregado correctamente', 'success');
            }
            
            // Recargar tabla y cerrar modal
            this.loadPatientsTable();
            this.loadDashboardStats();
            this.populateSelectOptions();
            closeModal('addPatientModal');
            this.editingId = null;
            
        } catch (error) {
            console.error('Error al manejar paciente:', error);
            showAlert('Error al procesar la información', 'error');
        }
    }
    
    // Manejar envío de consulta
    handleConsultationSubmit(e) {
        try {
            const formData = new FormData(e.target);
            const data = {
                doctorId: parseInt(formData.get('doctorId')),
                patientId: parseInt(formData.get('patientId')),
                date: new Date(formData.get('date')),
                diagnosis: formData.get('diagnosis')
            };
            
            // Validar datos
            if (!data.doctorId || !data.patientId || !data.date || !data.diagnosis) {
                showAlert('Todos los campos son obligatorios', 'error');
                return;
            }
            
            if (this.editingId) {
                // Editar consulta existente
                const updated = db.update('consultations', this.editingId, {
                    doctorId: data.doctorId,
                    patientId: data.patientId,
                    date: data.date,
                    diagnosis: db.sanitizeInput(data.diagnosis),
                    status: 'completed'
                });
                
                if (updated) {
                    showAlert('Consulta actualizada correctamente', 'success');
                } else {
                    showAlert('Error al actualizar consulta', 'error');
                }
            } else {
                // Crear nueva consulta
                const consultationId = db.insert('consultations', {
                    doctorId: data.doctorId,
                    patientId: data.patientId,
                    date: data.date,
                    diagnosis: db.sanitizeInput(data.diagnosis),
                    status: 'completed'
                });
                
                showAlert('Consulta agregada correctamente', 'success');
            }
            
            // Recargar tabla y cerrar modal
            this.loadConsultationsTable();
            this.loadDashboardStats();
            closeModal('addConsultationModal');
            this.editingId = null;
            
        } catch (error) {
            console.error('Error al manejar consulta:', error);
            showAlert('Error al procesar la información', 'error');
        }
    }
    
    // Manejar envío de receta
    handlePrescriptionSubmit(e) {
        try {
            const formData = new FormData(e.target);
            const data = {
                doctorId: parseInt(formData.get('doctorId')),
                patientId: parseInt(formData.get('patientId')),
                date: new Date(formData.get('date')),
                medication: formData.get('medication'),
                instructions: formData.get('instructions')
            };
            
            // Validar datos
            if (!data.doctorId || !data.patientId || !data.date || !data.medication || !data.instructions) {
                showAlert('Todos los campos son obligatorios', 'error');
                return;
            }
            
            if (this.editingId) {
                // Editar receta existente
                const updated = db.update('prescriptions', this.editingId, {
                    doctorId: data.doctorId,
                    patientId: data.patientId,
                    date: data.date,
                    medication: db.sanitizeInput(data.medication),
                    instructions: db.sanitizeInput(data.instructions),
                    status: 'active'
                });
                
                if (updated) {
                    showAlert('Receta actualizada correctamente', 'success');
                } else {
                    showAlert('Error al actualizar receta', 'error');
                }
            } else {
                // Crear nueva receta
                const prescriptionId = db.insert('prescriptions', {
                    doctorId: data.doctorId,
                    patientId: data.patientId,
                    date: data.date,
                    medication: db.sanitizeInput(data.medication),
                    instructions: db.sanitizeInput(data.instructions),
                    status: 'active'
                });
                
                showAlert('Receta agregada correctamente', 'success');
            }
            
            // Recargar tabla y cerrar modal
            this.loadPrescriptionsTable();
            this.loadDashboardStats();
            closeModal('addPrescriptionModal');
            this.editingId = null;
            
        } catch (error) {
            console.error('Error al manejar receta:', error);
            showAlert('Error al procesar la información', 'error');
        }
    }
    
    // Editar doctor
    editDoctor(id) {
        try {
            const doctor = db.findById('doctors', id);
            if (!doctor) {
                showAlert('Doctor no encontrado', 'error');
                return;
            }
            
            this.editingId = id;
            
            // Llenar formulario con datos existentes
            const form = document.getElementById('addDoctorForm');
            form.querySelector('input[name="name"]').value = doctor.name;
            form.querySelector('input[name="email"]').value = doctor.email;
            form.querySelector('input[name="specialty"]').value = doctor.specialty;
            form.querySelector('input[name="license"]').value = doctor.license;
            
            // Cambiar título del modal
            const modalTitle = document.querySelector('#addDoctorModal h3');
            modalTitle.textContent = 'Editar Doctor';
            
            showModal('addDoctorModal');
        } catch (error) {
            console.error('Error al editar doctor:', error);
            showAlert('Error al cargar datos del doctor', 'error');
        }
    }
    
    // Eliminar doctor
    deleteDoctor(id) {
        if (!confirm('¿Estás seguro de eliminar este doctor? Esta acción no se puede deshacer.')) {
            return;
        }
        
        try {
            const deleted = db.delete('doctors', id);
            if (deleted) {
                showAlert('Doctor eliminado correctamente', 'success');
                this.loadDoctorsTable();
                this.loadDashboardStats();
                this.populateSelectOptions();
            } else {
                showAlert('Error al eliminar doctor', 'error');
            }
        } catch (error) {
            console.error('Error al eliminar doctor:', error);
            showAlert('Error al eliminar doctor', 'error');
        }
    }
    
    // Editar paciente
    editPatient(id) {
        try {
            const patient = db.findById('patients', id);
            if (!patient) {
                showAlert('Paciente no encontrado', 'error');
                return;
            }
            
            this.editingId = id;
            
            // Llenar formulario con datos existentes
            const form = document.getElementById('addPatientForm');
            form.querySelector('input[name="name"]').value = patient.name;
            form.querySelector('input[name="email"]').value = patient.email;
            form.querySelector('input[name="phone"]').value = patient.phone || '';
            form.querySelector('input[name="age"]').value = patient.age || '';
            
            // Cambiar título del modal
            const modalTitle = document.querySelector('#addPatientModal h3');
            modalTitle.textContent = 'Editar Paciente';
            
            showModal('addPatientModal');
        } catch (error) {
            console.error('Error al editar paciente:', error);
            showAlert('Error al cargar datos del paciente', 'error');
        }
    }
    
    // Eliminar paciente
    deletePatient(id) {
        if (!confirm('¿Estás seguro de eliminar este paciente? Esta acción no se puede deshacer.')) {
            return;
        }
        
        try {
            const deleted = db.delete('patients', id);
            if (deleted) {
                showAlert('Paciente eliminado correctamente', 'success');
                this.loadPatientsTable();
                this.loadDashboardStats();
                this.populateSelectOptions();
            } else {
                showAlert('Error al eliminar paciente', 'error');
            }
        } catch (error) {
            console.error('Error al eliminar paciente:', error);
            showAlert('Error al eliminar paciente', 'error');
        }
    }
    
    // Editar consulta
    editConsultation(id) {
        try {
            const consultation = db.findById('consultations', id);
            if (!consultation) {
                showAlert('Consulta no encontrada', 'error');
                return;
            }
            
            this.editingId = id;
            
            // Poblar selects antes de establecer valores
            this.populateSelectOptions();
            
            setTimeout(() => {
                // Llenar formulario con datos existentes
                const form = document.getElementById('addConsultationForm');
                form.querySelector('select[name="doctorId"]').value = consultation.doctorId;
                form.querySelector('select[name="patientId"]').value = consultation.patientId;
                
                // Formatear fecha para datetime-local
                const date = new Date(consultation.date);
                const formattedDate = date.getFullYear() + '-' + 
                    String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(date.getDate()).padStart(2, '0') + 'T' + 
                    String(date.getHours()).padStart(2, '0') + ':' + 
                    String(date.getMinutes()).padStart(2, '0');
                
                form.querySelector('input[name="date"]').value = formattedDate;
                form.querySelector('textarea[name="diagnosis"]').value = consultation.diagnosis;
                
                // Cambiar título del modal
                const modalTitle = document.querySelector('#addConsultationModal h3');
                modalTitle.textContent = 'Editar Consulta';
                
                showModal('addConsultationModal');
            }, 100);
        } catch (error) {
            console.error('Error al editar consulta:', error);
            showAlert('Error al cargar datos de la consulta', 'error');
        }
    }
    
    // Eliminar consulta
    deleteConsultation(id) {
        if (!confirm('¿Estás seguro de eliminar esta consulta? Esta acción no se puede deshacer.')) {
            return;
        }
        
        try {
            const deleted = db.delete('consultations', id);
            if (deleted) {
                showAlert('Consulta eliminada correctamente', 'success');
                this.loadConsultationsTable();
                this.loadDashboardStats();
            } else {
                showAlert('Error al eliminar consulta', 'error');
            }
        } catch (error) {
            console.error('Error al eliminar consulta:', error);
            showAlert('Error al eliminar consulta', 'error');
        }
    }
    
    // Editar receta
    editPrescription(id) {
        try {
            const prescription = db.findById('prescriptions', id);
            if (!prescription) {
                showAlert('Receta no encontrada', 'error');
                return;
            }
            
            this.editingId = id;
            
            // Poblar selects antes de establecer valores
            this.populateSelectOptions();
            
            setTimeout(() => {
                // Llenar formulario con datos existentes
                const form = document.getElementById('addPrescriptionForm');
                form.querySelector('select[name="doctorId"]').value = prescription.doctorId;
                form.querySelector('select[name="patientId"]').value = prescription.patientId;
                
                // Formatear fecha para datetime-local
                const date = new Date(prescription.date);
                const formattedDate = date.getFullYear() + '-' + 
                    String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(date.getDate()).padStart(2, '0') + 'T' + 
                    String(date.getHours()).padStart(2, '0') + ':' + 
                    String(date.getMinutes()).padStart(2, '0');
                
                form.querySelector('input[name="date"]').value = formattedDate;
                form.querySelector('input[name="medication"]').value = prescription.medication;
                form.querySelector('textarea[name="instructions"]').value = prescription.instructions;
                
                // Cambiar título del modal
                const modalTitle = document.querySelector('#addPrescriptionModal h3');
                modalTitle.textContent = 'Editar Receta';
                
                showModal('addPrescriptionModal');
            }, 100);
        } catch (error) {
            console.error('Error al editar receta:', error);
            showAlert('Error al cargar datos de la receta', 'error');
        }
    }
    
    // Eliminar receta
    deletePrescription(id) {
        if (!confirm('¿Estás seguro de eliminar esta receta? Esta acción no se puede deshacer.')) {
            return;
        }
        
        try {
            const deleted = db.delete('prescriptions', id);
            if (deleted) {
                showAlert('Receta eliminada correctamente', 'success');
                this.loadPrescriptionsTable();
                this.loadDashboardStats();
            } else {
                showAlert('Error al eliminar receta', 'error');
            }
        } catch (error) {
            console.error('Error al eliminar receta:', error);
            showAlert('Error al eliminar receta', 'error');
        }
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