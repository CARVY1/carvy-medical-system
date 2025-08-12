// Base de datos NoSQL simulada en memoria
class CarvyDatabase {
    constructor() {
        this.collections = {
            users: [],
            doctors: [],
            patients: [],
            consultations: [],
            prescriptions: []
        };
        
        this.counters = {
            users: 0,
            doctors: 0,
            patients: 0,
            consultations: 0,
            prescriptions: 0
        };
        
        this.initializeData();
    }
    
    // Inicializar con datos de prueba
    initializeData() {
        // Admin por defecto
        this.insert('users', {
            email: 'admin@carvy.com',
            password: this.hashPassword('admin123'),
            role: 'admin',
            name: 'Administrador',
            isActive: true,
            createdAt: new Date()
        });
        
        // Doctor de prueba
        const doctorId = this.insert('doctors', {
            name: 'Dr. Juan Pérez',
            email: 'doctor@carvy.com',
            specialty: 'Medicina General',
            license: 'MED-001',
            isActive: true,
            createdAt: new Date()
        });
        
        this.insert('users', {
            email: 'doctor@carvy.com',
            password: this.hashPassword('doctor123'),
            role: 'doctor',
            name: 'Dr. Juan Pérez',
            doctorId: doctorId,
            isActive: true,
            createdAt: new Date()
        });
        
        // Paciente de prueba
        const patientId = this.insert('patients', {
            name: 'María García',
            email: 'patient@carvy.com',
            phone: '555-1234',
            age: 35,
            isActive: true,
            createdAt: new Date()
        });
        
        this.insert('users', {
            email: 'patient@carvy.com',
            password: this.hashPassword('patient123'),
            role: 'patient',
            name: 'María García',
            patientId: patientId,
            isActive: true,
            createdAt: new Date()
        });
        
        // Consulta de prueba
        const consultationId = this.insert('consultations', {
            doctorId: doctorId,
            patientId: patientId,
            date: new Date(),
            diagnosis: 'Consulta de rutina - Todo normal',
            status: 'completed',
            createdAt: new Date()
        });
        
        // Receta de prueba
        this.insert('prescriptions', {
            consultationId: consultationId,
            doctorId: doctorId,
            patientId: patientId,
            medication: 'Paracetamol 500mg',
            instructions: 'Tomar 1 tableta cada 8 horas por 3 días después de las comidas',
            date: new Date(),
            status: 'active',
            createdAt: new Date()
        });
    }
    
    // Generar ID único
    generateId(collection) {
        this.counters[collection]++;
        return this.counters[collection];
    }
    
    // Insertar documento
    insert(collection, document) {
        const id = this.generateId(collection);
        const doc = {
            id: id,
            ...document,
            createdAt: document.createdAt || new Date(),
            updatedAt: new Date()
        };
        
        this.collections[collection].push(doc);
        return id;
    }
    
    // Buscar documentos
    find(collection, query = {}) {
        return this.collections[collection].filter(doc => {
            return Object.keys(query).every(key => {
                if (query[key] === undefined || query[key] === null) return true;
                return doc[key] === query[key];
            });
        });
    }
    
    // Buscar un documento por ID
    findById(collection, id) {
        return this.collections[collection].find(doc => doc.id === parseInt(id));
    }
    
    // Buscar un documento
    findOne(collection, query) {
        return this.collections[collection].find(doc => {
            return Object.keys(query).every(key => {
                if (query[key] === undefined || query[key] === null) return true;
                return doc[key] === query[key];
            });
        });
    }
    
    // Actualizar documento
    update(collection, id, updates) {
        const index = this.collections[collection].findIndex(doc => doc.id === parseInt(id));
        if (index !== -1) {
            this.collections[collection][index] = {
                ...this.collections[collection][index],
                ...updates,
                updatedAt: new Date()
            };
            return this.collections[collection][index];
        }
        return null;
    }
    
    // Eliminar documento
    delete(collection, id) {
        const index = this.collections[collection].findIndex(doc => doc.id === parseInt(id));
        if (index !== -1) {
            const deleted = this.collections[collection][index];
            this.collections[collection].splice(index, 1);
            return deleted;
        }
        return null;
    }
    
    // Obtener todos los documentos de una colección
    getAll(collection) {
        return [...this.collections[collection]];
    }
    
    // Buscar consultas por doctor
    findConsultationsByDoctor(doctorId) {
        return this.find('consultations', { doctorId: parseInt(doctorId) });
    }
    
    // Buscar consultas por paciente
    findConsultationsByPatient(patientId) {
        return this.find('consultations', { patientId: parseInt(patientId) });
    }
    
    // Buscar recetas por consulta
    findPrescriptionsByConsultation(consultationId) {
        return this.find('prescriptions', { consultationId: parseInt(consultationId) });
    }
    
    // Buscar recetas por doctor
    findPrescriptionsByDoctor(doctorId) {
        return this.find('prescriptions', { doctorId: parseInt(doctorId) });
    }
    
    // Buscar recetas por paciente
    findPrescriptionsByPatient(patientId) {
        return this.find('prescriptions', { patientId: parseInt(patientId) });
    }
    
    // Buscar pacientes de un doctor
    findPatientsByDoctor(doctorId) {
        const consultations = this.findConsultationsByDoctor(doctorId);
        const patientIds = [...new Set(consultations.map(c => c.patientId))];
        return patientIds.map(id => this.findById('patients', id)).filter(p => p);
    }
    
    // Validar email único
    isEmailUnique(email, excludeId = null) {
        const existingUser = this.findOne('users', { email: email.toLowerCase() });
        if (!existingUser) return true;
        if (excludeId && existingUser.id === parseInt(excludeId)) return true;
        return false;
    }
    
    // Hash de contraseña (simulado)
    hashPassword(password) {
        return btoa(password + 'carvy_salt');
    }
    
    // Verificar contraseña
    verifyPassword(password, hash) {
        return this.hashPassword(password) === hash;
    }
    
    // Formatear fecha
    formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Validar email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Sanitizar entrada
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        return input.trim().replace(/[<>]/g, '');
    }
    
    // Obtener estadísticas para el dashboard
    getStats() {
        return {
            totalDoctors: this.collections.doctors.length,
            totalPatients: this.collections.patients.length,
            totalConsultations: this.collections.consultations.length,
            totalPrescriptions: this.collections.prescriptions.length
        };
    }
}