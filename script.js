// --- INTERFAZ ---
// Navbar Sticky
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
});
 
// Partículas
const particlesContainer = document.getElementById('particles');
if (particlesContainer) {
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 5 + 's';
        particlesContainer.appendChild(particle);
    }
}

// Scroll Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

document.querySelectorAll('.animated-element').forEach(el => observer.observe(el));


// --- SISTEMA CRUD DE PACIENTES (LocalStorage) ---

// Estado inicial
let isAuthenticated = false;
let currentUser = null;

const users = [
    { username: "acontreras", password: "1593", nombre: "Alejandra" },
    { username: "jnoguera", password: "2028", nombre: "Jacinta" },
    { username: "afarina", password: "1739", nombre: "Anriette" },
    { username: "ccampos", password: "1927", nombre: "Catalina" },
    { username: "admi", password: "9876", nombre: "Administrador" },
    { username: "chidalgo", password: "2015", nombre: "Constanza" },
    { username: "rriffo", password: "1737", nombre: "Rode" }
];

let patients = []; // Se cargará desde Supabase
let currentPatientId = null;
let currentProfesional = null;
let currentProfesionalNombre = "";
let currentTestId = null;
let currentDraftId = null;
let currentEditingVisitaId = null;

const PROFESIONALES_LISTA = {
    'terapeuta': [
        "Constanza Hidalgo Cárdenas",
        "Cindie Palma Araneda",
        "Nataly Mersey Ortega"
    ],
    'psicologo': [
        "Vicente Acuña",
        "Anriette Fariña",
        "Jacinta Noguera Barthou"
    ]
};

const USER_PROFILES = {
    acontreras: { area: 'terapeuta', nombre: 'Alejandra Contreras' },
    chidalgo: { area: 'terapeuta', nombre: 'Constanza Hidalgo' },
    jnoguera: { area: 'psicologo', nombre: 'Jacinta Noguera' },
    afarina: { area: 'psicologo', nombre: 'Anriette Fariña' }
};

const plantillasProfesionales = {
    'psicologo': [
        { id: 'eval-psicologica', nombre: 'Evaluación Psicológica Inicial' },
        { id: 'yesavage', nombre: 'Escala de Yesavage (GDS-15)' },
        { id: 'hamilton-ansiedad', nombre: 'Escala de Hamilton (HAMA)' }
    ],
    'terapeuta': [
        { id: 'eval-to', nombre: 'Test Inicial (TO)' },
        { id: 'lawton-brody', nombre: 'Escala Lawton y Brody (AIVD)' },
        { id: 'barthel', nombre: 'Índice de Barthel (ABVD)' },
        { id: 'mmse', nombre: 'Mini Mental State Examination (MMSE)' }
    ]
};

const testTO = {
    title: 'Evaluación Clínica de Terapia Ocupacional',
    sections: [
        {
            title: 'SECCIÓN I: DATOS DE IDENTIFICACIÓN',
            fields: [
                { id: 'to_nombre', label: 'Nombre completo del beneficiario/a', type: 'text', required: true },
                { id: 'to_edad', label: 'Edad', type: 'number', required: true },
                { id: 'to_fechaNac', label: 'Fecha de nacimiento', type: 'date', required: true },
                { id: 'to_viveCon', label: '¿Con quién vive actualmente?', type: 'checkbox', options: ['Solo/a', 'Con nietos/as', 'Con cónyuge o pareja', 'Con cuidador/a', 'Con hijos/as', 'Con otros familiares', 'Otra'] },
                { id: 'to_viveCon_otra', label: 'Especifique otra', type: 'text', condition: { field: 'to_viveCon', value: 'Otra' } },
                { id: 'to_escolaridad', label: '¿Cuál es su nivel de escolaridad?', type: 'radio', options: ['Sin escolaridad formal', 'Básica incompleta', 'Básica completa', 'Media incompleta', 'Media completa', 'Técnica o universitaria'] },
                { id: 'to_ocupacion', label: '¿Cuál fue su ocupación o trabajo principal durante su vida?', type: 'textarea' },
                { id: 'to_actividad', label: '¿Actualmente realiza alguna actividad remunerada o voluntaria?', type: 'radio', options: ['Sí', 'No'] },
                { id: 'to_actividad_cual', label: '¿Cuál y con qué frecuencia?', type: 'textarea', condition: { field: 'to_actividad', value: 'Sí' } }
            ]
        },
        {
            title: 'SECCIÓN II: RUTINA DIARIA Y HÁBITOS OCUPACIONALES',
            fields: [
                { id: 'to_rutina', label: '¿Cómo es un día típico suyo?', type: 'textarea' },
                { id: 'to_levanta', label: 'A qué hora se levanta', type: 'text' },
                { id: 'to_acuesta', label: 'A qué hora se acuesta', type: 'text' },
                { id: 'to_indep', label: '¿Qué actividades realiza de forma independiente?', type: 'checkbox', options: ['Preparar alimentos', 'Hacer aseo', 'Lavar ropa', 'Hacer compras', 'Usar teléfono', 'Salir solo/a', 'Tomar medicamentos', 'Cuidar plantas/animales', 'Manejar dinero', 'Otra'] },
                { id: 'to_indep_otra', label: 'Especifique otra actividad', type: 'text', condition: { field: 'to_indep', value: 'Otra' } },
                { id: 'to_ayuda', label: '¿En cuáles actividades necesita ayuda?', type: 'textarea' },
                { id: 'to_tiempolibre', label: '¿Cuánto tiempo libre tiene y qué hace?', type: 'textarea' }
            ]
        },
        {
            title: 'SECCIÓN III: INTERESES Y ACTIVIDADES',
            fields: [
                { id: 'to_intereses_escala', label: 'Nivel de interés (1 al 5)', type: 'radio-grid', rows: ['Caminatas', 'Jardinería', 'Cocinar', 'Manualidades', 'Lectura', 'TV/radio', 'Música', 'Bailar', 'Pintura', 'Juegos de mesa', 'Deporte', 'Actividades religiosas', 'Talleres comunitarios', 'Cuidar familiares', 'Uso de teléfono'], options: ['1', '2', '3', '4', '5'] },
                { id: 'to_intereses_otra', label: 'Otra actividad', type: 'text' },
                { id: 'to_intereses_importantes', label: 'Actividades más importantes y por qué', type: 'textarea' },
                { id: 'to_intereses_dejo', label: 'Actividad que dejó de hacer', type: 'textarea' },
                { id: 'to_intereses_quiere', label: 'Actividad que siempre quiso hacer', type: 'textarea' }
            ]
        },
        {
            title: 'SECCIÓN IV: ROLES OCUPACIONALES',
            fields: [
                { id: 'to_roles', label: 'Seleccione sus roles', type: 'checkbox', options: ['Padre/Madre', 'Abuelo/a', 'Cónyuge', 'Amigo/a', 'Vecino/a', 'Cuidador/a', 'Participante social', 'Persona de fe', 'Aficionado', 'Trabajador/voluntario', 'Otra'] },
                { id: 'to_rol_importante', label: 'Rol más importante', type: 'textarea' },
                { id: 'to_rol_perdida', label: 'Pérdida de rol', type: 'textarea' },
                { id: 'to_entorno_valora', label: '¿Siente que su entorno lo valora?', type: 'radio', options: ['Nunca', 'Rara vez', 'A veces', 'Frecuentemente', 'Siempre'] }
            ]
        },
        {
            title: 'SECCIÓN V: METAS Y MOTIVACIÓN',
            fields: [
                { id: 'to_mejora', label: 'Mejora principal en su vida', type: 'textarea' },
                { id: 'to_act_futuras', label: 'Actividades que quiere hacer', type: 'textarea' },
                { id: 'to_metas', label: 'Metas futuras', type: 'textarea' },
                { id: 'to_motivacion', label: 'Nivel de motivación', type: 'radio', options: ['Nada motivado', 'Poco motivado', 'Algo motivado', 'Bastante motivado', 'Muy motivado'] },
                { id: 'to_motivacion_mas', label: '¿Qué lo motivaría más?', type: 'textarea' }
            ]
        },
        {
            title: 'SECCIÓN VI: ENTORNO Y RED DE APOYO',
            fields: [
                { id: 'to_salir_solo', label: '¿Puede salir solo?', type: 'radio', options: ['Sí', 'No'] },
                { id: 'to_salir_apoyo', label: '¿Usa apoyo?', type: 'text', condition: { field: 'to_salir_solo', value: 'Sí' } },
                { id: 'to_barreras', label: '¿Existen barreras en el hogar?', type: 'textarea' },
                { id: 'to_contacto_social', label: 'Frecuencia de contacto social', type: 'radio', options: ['Nunca', 'Mensual', 'Semanal', 'Varias veces por semana', 'Todos los días'] },
                { id: 'to_red_apoyo', label: '¿Tiene red de apoyo?', type: 'radio', options: ['Sí', 'No'] },
                { id: 'to_quienes', label: '¿Quiénes?', type: 'text', condition: { field: 'to_red_apoyo', value: 'Sí' } },
                { id: 'to_act_comunitarias', label: '¿Participa en actividades comunitarias?', type: 'radio', options: ['Sí', 'No'] },
                { id: 'to_act_cual', label: '¿Cuál y frecuencia?', type: 'text', condition: { field: 'to_act_comunitarias', value: 'Sí' } }
            ]
        }
    ]
};

const testLawtonBrody = {
    title: 'Escala de Lawton y Brody (AIVD)',
    sections: [
        {
            title: '👤 Datos del Evaluado',
            fields: [
                { id: 'lb_sexo', label: 'Sexo del evaluado', type: 'sex-selector', required: true },
                { id: 'lb_guia', label: 'Guía de Interpretación', type: 'interpretation-guide' }
            ]
        },
        {
            title: '🔹 Capacidad para usar el teléfono',
            fields: [
                { id: 'lb_tel_1', label: 'Utiliza el teléfono por iniciativa propia', type: 'scored-number', required: true },
                { id: 'lb_tel_2', label: 'Es capaz de marcar números familiares', type: 'scored-number', required: true },
                { id: 'lb_tel_3', label: 'Contesta el teléfono pero no marca', type: 'scored-number', required: true },
                { id: 'lb_tel_4', label: 'No es capaz de usar el teléfono', type: 'scored-number', required: true }
            ]
        },
        {
            title: '🔹 Hacer compras',
            fields: [
                { id: 'lb_comp_1', label: 'Realiza todas las compras independientemente', type: 'scored-number', required: true },
                { id: 'lb_comp_2', label: 'Realiza pequeñas compras', type: 'scored-number', required: true },
                { id: 'lb_comp_3', label: 'Necesita acompañamiento', type: 'scored-number', required: true },
                { id: 'lb_comp_4', label: 'Incapaz de comprar', type: 'scored-number', required: true }
            ]
        },
        {
            title: '🔹 Preparación de la comida',
            fields: [
                { id: 'lb_com_1', label: 'Organiza, prepara y sirve adecuadamente', type: 'scored-number', required: true },
                { id: 'lb_com_2', label: 'Prepara con ingredientes', type: 'scored-number', required: true },
                { id: 'lb_com_3', label: 'No sigue dieta adecuada', type: 'scored-number', required: true },
                { id: 'lb_com_4', label: 'Necesita que le preparen la comida', type: 'scored-number', required: true }
            ]
        },
        {
            title: '🔹 Cuidado de la casa',
            fields: [
                { id: 'lb_cas_1', label: 'Mantiene la casa solo o con ayuda ocasional', type: 'scored-number', required: true },
                { id: 'lb_cas_2', label: 'Realiza tareas ligeras', type: 'scored-number', required: true },
                { id: 'lb_cas_3', label: 'No mantiene limpieza adecuada', type: 'scored-number', required: true },
                { id: 'lb_cas_4', label: 'Necesita ayuda en todo', type: 'scored-number', required: true },
                { id: 'lb_cas_5', label: 'No participa', type: 'scored-number', required: true }
            ]
        },
        {
            title: '🔹 Lavado de la ropa',
            fields: [
                { id: 'lb_rop_1', label: 'Lava toda su ropa', type: 'scored-number', required: true },
                { id: 'lb_rop_2', label: 'Lava parcialmente', type: 'scored-number', required: true },
                { id: 'lb_rop_3', label: 'Dependiente', type: 'scored-number', required: true }
            ]
        },
        {
            title: '🔹 Uso de transporte',
            fields: [
                { id: 'lb_tra_1', label: 'Viaja solo o conduce', type: 'scored-number', required: true },
                { id: 'lb_tra_2', label: 'Usa taxi', type: 'scored-number', required: true },
                { id: 'lb_tra_3', label: 'Viaja acompañado', type: 'scored-number', required: true },
                { id: 'lb_tra_4', label: 'Usa transporte con ayuda', type: 'scored-number', required: true },
                { id: 'lb_tra_5', label: 'No viaja', type: 'scored-number', required: true }
            ]
        },
        {
            title: '🔹 Medicación',
            fields: [
                { id: 'lb_med_1', label: 'Toma correctamente', type: 'scored-number', required: true },
                { id: 'lb_med_2', label: 'Supervisada', type: 'scored-number', required: true },
                { id: 'lb_med_3', label: 'Dependiente', type: 'scored-number', required: true }
            ]
        },
        {
            title: '🔹 Manejo económico',
            fields: [
                { id: 'lb_din_1', label: 'Maneja dinero solo', type: 'scored-number', required: true },
                { id: 'lb_din_2', label: 'Maneja parcialmente', type: 'scored-number', required: true },
                { id: 'lb_din_3', label: 'Dependiente', type: 'scored-number', required: true }
            ]
        },
        {
            title: '🧮 RESULTADO FINAL',
            fields: [
                { id: 'lb_total', label: 'Puntaje Total', type: 'total-score', sourcePrefix: 'lb_', readonly: true },
                { id: 'lb_clasif', label: 'Clasificación sugerida', type: 'suggested-classification' }
            ]
        }
    ]
};

const testYesavage = {
    title: 'Escala de Yesavage – GDS-15 (Geriatric Depression Scale)',
    sections: [
        {
            title: '🧠 Tamizaje de Síntomas Depresivos',
            fields: [
                { id: 'ys_1', label: '¿Está básicamente satisfecho con su vida?', type: 'scored-yesno', yesScore: 0, noScore: 1, required: true },
                { id: 'ys_2', label: '¿Ha abandonado muchos de sus intereses y actividades?', type: 'scored-yesno', yesScore: 1, noScore: 0, required: true },
                { id: 'ys_3', label: '¿Siente que su vida está vacía?', type: 'scored-yesno', yesScore: 1, noScore: 0, required: true },
                { id: 'ys_4', label: '¿Se aburre a menudo?', type: 'scored-yesno', yesScore: 1, noScore: 0, required: true },
                { id: 'ys_5', label: '¿Está de buen humor la mayor parte del tiempo?', type: 'scored-yesno', yesScore: 0, noScore: 1, required: true },
                { id: 'ys_6', label: '¿Tiene miedo a que le vaya a pasar algo malo?', type: 'scored-yesno', yesScore: 1, noScore: 0, required: true },
                { id: 'ys_7', label: '¿Se siente feliz la mayor parte del tiempo?', type: 'scored-yesno', yesScore: 0, noScore: 1, required: true },
                { id: 'ys_8', label: '¿Se siente a menudo impotente?', type: 'scored-yesno', yesScore: 1, noScore: 0, required: true },
                { id: 'ys_9', label: '¿Prefiere quedarse en casa en lugar de salir y hacer cosas nuevas?', type: 'scored-yesno', yesScore: 1, noScore: 0, required: true },
                { id: 'ys_10', label: '¿Siente que tiene más problemas de memoria que la mayoría?', type: 'scored-yesno', yesScore: 1, noScore: 0, required: true },
                { id: 'ys_11', label: '¿Cree que es maravilloso estar vivo ahora?', type: 'scored-yesno', yesScore: 0, noScore: 1, required: true },
                { id: 'ys_12', label: '¿Se siente bastante inútil tal y como está ahora?', type: 'scored-yesno', yesScore: 1, noScore: 0, required: true },
                { id: 'ys_13', label: '¿Se siente lleno de energía?', type: 'scored-yesno', yesScore: 0, noScore: 1, required: true },
                { id: 'ys_14', label: '¿Siente que su situación es desesperanzadora?', type: 'scored-yesno', yesScore: 1, noScore: 0, required: true },
                { id: 'ys_15', label: '¿Cree que la mayoría de la gente está mejor que usted?', type: 'scored-yesno', yesScore: 1, noScore: 0, required: true }
            ]
        },
        {
            title: '🧮 RESULTADO DEL TAMIZAJE',
            fields: [
                { id: 'ys_total', label: 'Puntaje Total', type: 'total-score', sourcePrefix: 'ys_', readonly: true },
                { id: 'ys_resultado', label: 'Resultado de tamizaje depresivo', type: 'depression-result' },
                { id: 'ys_obs', label: 'Observaciones del profesional', type: 'textarea', required: false }
            ]
        }
    ]
};

const testEvalPsicologica = {
    title: 'Evaluación Psicológica Inicial – Adulto Mayor',
    sections: [
        {
            title: '🔹 I. PRESENTACIÓN Y ENCUADRE DEL PROCESO TERAPÉUTICO',
            fields: [
                {
                    id: 'ep_encuadre', label: 'Checklist de Presentación', type: 'checkbox', options: [
                        '1.1 Presentación personal: nombre, profesión y pertenencia al Programa del Adulto Mayor de la Municipalidad de Lo Barnechea.',
                        '1.2 Explicación del proceso: se realizarán 6 sesiones domiciliarias individuales de apoyo psicológico, con frecuencia semanal y duración mínima de 40 minutos cada una.',
                        '1.3 Confidencialidad: toda la información compartida es confidencial y sólo se utilizará para el cumplimiento del programa, conforme a la Ley N°19.628. Se exceptúa si existe riesgo para su vida o la de terceros.',
                        '1.4 Objetivo del proceso: acompañar el bienestar emocional, trabajar las preocupaciones actuales, fortalecer recursos personales y apoyar la participación en las sesiones de Terapia Ocupacional.',
                        '1.5 Derechos del beneficiario: puede hacer preguntas en cualquier momento, puede pedir pausas y puede finalizar la sesión si lo necesita.',
                        '1.6 Consentimiento verbal: solicitar al beneficiario que confirme verbalmente su disposición a participar en el proceso.'
                    ]
                },
                { id: 'ep_pregunta_proceso', label: '1.7 ¿Tiene alguna pregunta sobre cómo funcionará este proceso?', type: 'textarea' }
            ]
        },
        {
            title: '🔹 II. EXPLORACIÓN DE LA HISTORIA VITAL',
            fields: [
                { id: 'ep_salud_gen', label: '2.1 ¿Cómo está su salud en general? ¿Tiene alguna enfermedad o condición de salud que le afecte en su día a día?', type: 'textarea' },
                { id: 'ep_vida_pasada', label: '2.2 ¿Cómo era su vida hace 1 o 2 años atrás? ¿Qué ha cambiado desde entonces?', type: 'textarea' },
                { id: 'ep_perdida_sn', label: '2.3 ¿Ha perdido a alguna persona cercana (familiar, amigo/a, pareja) en el último tiempo?', type: 'radio', options: ['Sí', 'No'] },
                { id: 'ep_perdida_det', label: '¿Quién fue y cuándo ocurrió? ¿Cómo se siente hoy al respecto?', type: 'textarea', condition: { field: 'ep_perdida_sn', value: 'Sí' } },
                { id: 'ep_dejar_cosas', label: '2.4 ¿Ha tenido que dejar de hacer cosas que antes hacía? (actividades, salidas, trabajo, cuidado de otros) ¿Cómo se ha sentido con eso?', type: 'textarea' },
                { id: 'ep_cambios_rutina', label: '2.5 ¿Ha habido cambios importantes en su rutina diaria? ¿Duerme bien? ¿Come bien?', type: 'textarea' },
                { id: 'ep_sueno', label: 'Sueño', type: 'radio', options: ['Bueno', 'Regular', 'Malo'] },
                { id: 'ep_apetito', label: 'Apetito', type: 'radio', options: ['Bueno', 'Regular', 'Malo'] },
                { id: 'ep_energia', label: 'Energía', type: 'radio', options: ['Buena', 'Regular', 'Baja'] }
            ]
        },
        {
            title: '🔹 III. IDENTIFICACIÓN DE PREOCUPACIONES ACTUALES',
            fields: [
                { id: 'ep_preoc_actual', label: '3.1 ¿Hay algo que le preocupe mucho en este momento de su vida?', type: 'textarea' },
                { id: 'ep_miedo_caer', label: '3.2 ¿Siente miedo de caerse o de tener un accidente? ¿Eso le hace evitar ciertas actividades?', type: 'radio', options: ['Sí', 'No'] },
                { id: 'ep_miedo_obs', label: 'Observación:', type: 'text' },
                { id: 'ep_miedo_det', label: '¿Qué actividades evita? ¿Cómo afecta su vida?', type: 'textarea', condition: { field: 'ep_miedo_caer', value: 'Sí' } },
                { id: 'ep_preoc_salud', label: '3.3 ¿Le preocupa su salud o la posibilidad de enfermarse más? ¿Piensa mucho en eso?', type: 'textarea' },
                { id: 'ep_muerte', label: '3.4 ¿Piensa a veces en la muerte? ¿La muerte le genera angustia, miedo o paz?', type: 'textarea' },
                { id: 'ep_soledad_frec', label: '3.5 ¿Se siente solo/a? ¿Con qué frecuencia tiene contacto con personas que le importan?', type: 'radio', options: ['Nunca', 'Rara vez', 'A veces', 'Con frecuencia', 'Casi siempre'] },
                { id: 'ep_soledad_text', label: 'Detalle sobre soledad:', type: 'textarea' },
                { id: 'ep_autonomia_frec', label: '3.6 ¿Siente que puede tomar decisiones sobre su propia vida o siente que otros deciden por usted?', type: 'radio', options: ['Nada de autonomía', 'Poca autonomía', 'Algo de autonomía', 'Bastante autonomía', 'Plena autonomía'] },
                { id: 'ep_autonomia_text', label: 'Detalle sobre autonomía:', type: 'textarea' },
                { id: 'ep_tristeza_frec', label: '3.7 ¿Se ha sentido triste, sin ánimo o sin ganas de hacer cosas en las últimas semanas?', type: 'radio', options: ['Nunca', 'Casi nunca', 'Algunas veces', 'Con frecuencia', 'Casi siempre'] },
                { id: 'ep_tristeza_text', label: 'Detalle sobre tristeza:', type: 'textarea' },
                { id: 'ep_ansiedad_frec', label: '3.8 ¿Se siente nervioso/a, ansioso/a o con sensación de que algo malo va a pasar?', type: 'radio', options: ['Nunca', 'Casi nunca', 'Algunas veces', 'Con frecuencia', 'Casi siempre'] },
                { id: 'ep_ansiedad_text', label: 'Detalle sobre ansiedad:', type: 'textarea' }
            ]
        },
        {
            title: '🔹 IV. RECURSOS PSICOLÓGICOS Y RED DE APOYO',
            fields: [
                { id: 'ep_superar', label: '4.1 ¿Qué le ha ayudado a superar momentos difíciles?', type: 'textarea' },
                { id: 'ep_fortalezas', label: '4.2 ¿Qué fortalezas reconoce en usted?', type: 'textarea' },
                { id: 'ep_apoyo_text', label: '4.3 ¿Con quién cuenta cuando necesita apoyo?', type: 'textarea' },
                { id: 'ep_red_apoyo', label: 'Red de apoyo:', type: 'checkbox', options: ['Pareja', 'Amigos', 'Hijos', 'Vecinos', 'Nietos', 'Profesional de salud', 'Hermanos', 'Líder religioso', 'Otro'] },
                { id: 'ep_red_otro', label: 'Especifique otro:', type: 'text', condition: { field: 'ep_red_apoyo', value: 'Otro' } },
                { id: 'ep_sentido_vida', label: '4.4 ¿Qué le da sentido a su vida hoy?', type: 'textarea' },
                { id: 'ep_social_sn', label: '4.5 ¿Participa en actividades sociales o comunitarias?', type: 'radio', options: ['Sí', 'No'] },
                { id: 'ep_social_obs', label: 'Observación:', type: 'text' },
                { id: 'ep_social_det', label: '¿Cuál y con qué frecuencia?', type: 'textarea', condition: { field: 'ep_social_sn', value: 'Sí' } }
            ]
        },
        {
            title: '🔹 V. ESCALA YESAVAGE (GDS-15)',
            fields: [
                { id: 'ys_1', label: '¿Está básicamente satisfecho con su vida?', type: 'scored-yesno', yesScore: 0, noScore: 1, required: true },
                { id: 'ys_2', label: '¿Ha abandonado muchos de sus intereses y actividades?', type: 'scored-yesno', yesScore: 1, noScore: 0, required: true },
                { id: 'ys_3', label: '¿Siente que su vida está vacía?', type: 'scored-yesno', yesScore: 1, noScore: 0, required: true },
                { id: 'ys_4', label: '¿Se aburre a menudo?', type: 'scored-yesno', yesScore: 1, noScore: 0, required: true },
                { id: 'ys_5', label: '¿Está de buen humor la mayor parte del tiempo?', type: 'scored-yesno', yesScore: 0, noScore: 1, required: true },
                { id: 'ys_6', label: '¿Tiene miedo a que le vaya a pasar algo malo?', type: 'scored-yesno', yesScore: 1, noScore: 0, required: true },
                { id: 'ys_7', label: '¿Se siente feliz la mayor parte del tiempo?', type: 'scored-yesno', yesScore: 0, noScore: 1, required: true },
                { id: 'ys_8', label: '¿Se siente a menudo impotente?', type: 'scored-yesno', yesScore: 1, noScore: 0, required: true },
                { id: 'ys_9', label: '¿Prefiere quedarse en casa en lugar de salir y hacer cosas nuevas?', type: 'scored-yesno', yesScore: 1, noScore: 0, required: true },
                { id: 'ys_10', label: '¿Siente que tiene más problemas de memoria que la mayoría?', type: 'scored-yesno', yesScore: 1, noScore: 0, required: true },
                { id: 'ys_11', label: '¿Cree que es maravilloso estar vivo ahora?', type: 'scored-yesno', yesScore: 0, noScore: 1, required: true },
                { id: 'ys_12', label: '¿Se siente bastante inútil tal y como está ahora?', type: 'scored-yesno', yesScore: 1, noScore: 0, required: true },
                { id: 'ys_13', label: '¿Se siente lleno de energía?', type: 'scored-yesno', yesScore: 0, noScore: 1, required: true },
                { id: 'ys_14', label: '¿Siente que su situación es desesperanzadora?', type: 'scored-yesno', yesScore: 1, noScore: 0, required: true },
                { id: 'ys_15', label: '¿Cree que la mayoría de la gente está mejor que usted?', type: 'scored-yesno', yesScore: 1, noScore: 0, required: true },
                { id: 'ys_total', label: 'Puntaje Total (Yesavage)', type: 'total-score', sourcePrefix: 'ys_', readonly: true },
                { id: 'ys_resultado', label: 'Nivel de depresión', type: 'depression-result' },
                { id: 'ys_obs', label: 'Observaciones del profesional', type: 'textarea' }
            ]
        },
        {
            title: '🔹 VI. ESCALA DE ANSIEDAD GAI (ADAPTADA)',
            fields: [
                { id: 'gai_1', label: '¿Se preocupa mucho por cosas sin importancia?', type: 'scored-yesno', yesScore: 1, noScore: 0, required: true },
                { id: 'gai_2', label: '¿Tiene dificultad para relajarse?', type: 'scored-yesno', yesScore: 1, noScore: 0, required: true },
                { id: 'gai_3', label: '¿Tiene miedo de que algo malo pase?', type: 'scored-yesno', yesScore: 1, noScore: 0, required: true },
                { id: 'gai_4', label: '¿Se siente tenso/a?', type: 'scored-yesno', yesScore: 1, noScore: 0, required: true },
                { id: 'gai_5', label: '¿Se siente irritable?', type: 'scored-yesno', yesScore: 1, noScore: 0, required: true },
                { id: 'gai_6', label: '¿Tiene dificultad para conciliar el sueño por preocupaciones?', type: 'scored-yesno', yesScore: 1, noScore: 0, required: true },
                { id: 'gai_7', label: '¿Se siente cansado/a fácilmente?', type: 'scored-yesno', yesScore: 1, noScore: 0, required: true },
                { id: 'gai_8', label: '¿Le cuesta concentrarse?', type: 'scored-yesno', yesScore: 1, noScore: 0, required: true },
                { id: 'gai_9', label: '¿Tiene palpitaciones o falta de aire cuando se preocupa?', type: 'scored-yesno', yesScore: 1, noScore: 0, required: true },
                { id: 'gai_10', label: '¿Se siente inquieto/a?', type: 'scored-yesno', yesScore: 1, noScore: 0, required: true },
                { id: 'gai_total', label: 'Puntaje Total (GAI)', type: 'total-score', sourcePrefix: 'gai_', readonly: true },
                { id: 'gai_resultado', label: 'Nivel de ansiedad', type: 'anxiety-result' },
                { id: 'gai_checklist', label: 'Checklist acción clínica:', type: 'checkbox', options: ['Derivación psiquiatría', 'Técnicas relajación', 'Psicoterapia focalizada', 'Seguimiento estrecho'] },
                { id: 'gai_obs', label: 'Observaciones del profesional', type: 'textarea' }
            ]
        },
        {
            title: '🔹 VII. SÍNTESIS CLÍNICA FINAL',
            fields: [
                { id: 'sf_emocional', label: 'Estado emocional observado', type: 'textarea' },
                { id: 'sf_preoc', label: 'Preocupaciones principales', type: 'textarea' },
                { id: 'sf_perdidas', label: 'Pérdidas detectadas', type: 'textarea' },
                { id: 'sf_recursos', label: 'Recursos psicológicos', type: 'textarea' },
                { id: 'sf_diagnostico', label: 'Diagnóstico funcional', type: 'textarea' }
            ]
        },
        {
            title: '📊 RESUMEN FINAL',
            fields: [
                { id: 'rf_ys', label: 'Yesavage (Auto)', type: 'depression-result' },
                { id: 'rf_gai', label: 'GAI (Auto)', type: 'anxiety-result' },
                { id: 'rf_soledad', label: 'Soledad percibida', type: 'radio', options: ['Baja', 'Media', 'Alta'] },
                { id: 'rf_autonomia', label: 'Autonomía percibida', type: 'radio', options: ['Baja', 'Media', 'Alta'] },
                { id: 'rf_riesgo', label: 'Riesgo detectado', type: 'radio', options: ['No', 'Monitorear', 'Sí'] }
            ]
        },
        {
            title: '🎯 OBJETIVOS TERAPÉUTICOS',
            fields: [
                { id: 'obj_terap', label: 'Seleccione objetivos:', type: 'checkbox', options: ['Historia de vida', 'Reestructuración cognitiva', 'Manejo ansiedad', 'Red apoyo', 'Duelo', 'Sentido vida', 'Otro'] },
                { id: 'obj_otro', label: 'Especifique otro:', type: 'text', condition: { field: 'obj_terap', value: 'Otro' } }
            ]
        },
        {
            title: '🔹 FINAL',
            fields: [
                { id: 'coord_to', label: 'Coordinación con Terapia Ocupacional', type: 'textarea' }
            ]
        }
    ]
};

const testHamiltonAnsiedad = {
    title: 'Escala de Ansiedad de Hamilton (HAMA)',
    sections: [
        {
            title: '🧠 Evaluación Psicométrica de la Ansiedad',
            fields: [
                { id: 'ha_1', label: '1. Estado de ánimo ansioso', type: 'hamilton-row', subtext: 'Preocupaciones, anticipación de lo peor, aprensión, irritabilidad' },
                { id: 'ha_2', label: '2. Tensión', type: 'hamilton-row', subtext: 'Sensación de tensión, imposibilidad de relajarse, sobresaltos, llanto fácil, temblores, inquietud' },
                { id: 'ha_3', label: '3. Temores', type: 'hamilton-row', subtext: 'A la oscuridad, desconocidos, quedarse solo, animales, tráfico, multitudes' },
                { id: 'ha_4', label: '4. Insomnio', type: 'hamilton-row', subtext: 'Dificultad para dormir, sueño interrumpido, cansancio al despertar' },
                { id: 'ha_5', label: '5. Intelectual (cognitivo)', type: 'hamilton-row', subtext: 'Dificultad de concentración, mala memoria' },
                { id: 'ha_6', label: '6. Estado de ánimo deprimido', type: 'hamilton-row', subtext: 'Pérdida de interés, insatisfacción, cambios de humor' },
                { id: 'ha_7', label: '7. Síntomas somáticos (musculares)', type: 'hamilton-row', subtext: 'Dolores musculares, rigidez, temblores, voz temblorosa' },
                { id: 'ha_8', label: '8. Síntomas somáticos (sensoriales)', type: 'hamilton-row', subtext: 'Zumbidos, visión borrosa, sofocos, debilidad, hormigueo' },
                { id: 'ha_9', label: '9. Síntomas cardiovasculares', type: 'hamilton-row', subtext: 'Taquicardia, dolor torácico, palpitaciones' },
                { id: 'ha_10', label: '10. Síntomas respiratorios', type: 'hamilton-row', subtext: 'Opresión, ahogo, disnea' },
                { id: 'ha_11', label: '11. Síntomas gastrointestinales', type: 'hamilton-row', subtext: 'Gases, dolor, vómitos, diarrea, estreñimiento' },
                { id: 'ha_12', label: '12. Síntomas genitourinarios', type: 'hamilton-row', subtext: 'Micción frecuente, disfunción sexual' },
                { id: 'ha_13', label: '13. Síntomas autónomos', type: 'hamilton-row', subtext: 'Boca seca, sudoración, mareos, cefaleas' },
                { id: 'ha_14', label: '14. Comportamiento en la entrevista', type: 'hamilton-row', subtext: 'Tensión, inquietud, temblores, postura rígida, signos fisiológicos' }
            ]
        },
        {
            title: '📊 RESUMEN DE RESULTADOS (Automático)',
            fields: [
                { id: 'ha_total', label: 'PUNTAJE TOTAL (Ansiedad Global)', type: 'total-score', sourcePrefix: 'ha_', readonly: true },
                { id: 'ha_psiquica', label: 'Ansiedad Psíquica', type: 'dashboard-score', sourceFields: ['ha_1', 'ha_2', 'ha_3', 'ha_4', 'ha_5', 'ha_6', 'ha_14'], readonly: true },
                { id: 'ha_somatica', label: 'Ansiedad Somática', type: 'dashboard-score', sourceFields: ['ha_7', 'ha_8', 'ha_9', 'ha_10', 'ha_11', 'ha_12', 'ha_13'], readonly: true },
                { id: 'ha_obs', label: 'Observaciones del profesional', type: 'textarea' }
            ]
        }
    ]
};

const testBarthel = {
    title: 'Índice de Barthel – Actividades Básicas de la Vida Diaria (ABVD)',
    sections: [
        {
            title: '🔹 Evaluación Funcional',
            fields: [
                {
                    id: 'bt_comer', label: '1. Comer', type: 'scored-option-list', options: [
                        { text: 'Totalmente independiente', score: 10 },
                        { text: 'Necesita ayuda para cortar carne, el pan, etc.', score: 5 },
                        { text: 'Dependiente', score: 0 }
                    ], required: true
                },
                {
                    id: 'bt_lavarse', label: '2. Lavarse', type: 'scored-option-list', options: [
                        { text: 'Independiente: entra y sale solo del baño', score: 5 },
                        { text: 'Dependiente', score: 0 }
                    ], required: true
                },
                {
                    id: 'bt_vestirse', label: '3. Vestirse', type: 'scored-option-list', options: [
                        { text: 'Independiente: capaz de ponerse y quitarse la ropa, abotonarse, atarse los zapatos', score: 10 },
                        { text: 'Necesita ayuda', score: 5 },
                        { text: 'Dependiente', score: 0 }
                    ], required: true
                },
                {
                    id: 'bt_arreglarse', label: '4. Arreglarse', type: 'scored-option-list', options: [
                        { text: 'Independiente para lavarse la cara, manos, peinarse, afeitarse, maquillarse, etc.', score: 5 },
                        { text: 'Dependiente', score: 0 }
                    ], required: true
                },
                {
                    id: 'bt_deposiciones', label: '5. Deposiciones (valórese la semana previa)', type: 'scored-option-list', options: [
                        { text: 'Continencia normal', score: 10 },
                        { text: 'Ocasionalmente incontinencia o necesita ayuda', score: 5 },
                        { text: 'Incontinencia', score: 0 }
                    ], required: true
                },
                {
                    id: 'bt_miccion', label: '6. Micción (valórese la semana previa)', type: 'scored-option-list', options: [
                        { text: 'Continencia normal o maneja sonda', score: 10 },
                        { text: 'Episodio diario o necesita ayuda', score: 5 },
                        { text: 'Incontinencia', score: 0 }
                    ], required: true
                },
                {
                    id: 'bt_retrete', label: '7. Usar el retrete', type: 'scored-option-list', options: [
                        { text: 'Independiente', score: 10 },
                        { text: 'Necesita ayuda, pero se limpia solo', score: 5 },
                        { text: 'Dependiente', score: 0 }
                    ], required: true
                },
                {
                    id: 'bt_trasladarse', label: '8. Trasladarse', type: 'scored-option-list', options: [
                        { text: 'Independiente', score: 15 },
                        { text: 'Mínima ayuda o supervisión', score: 10 },
                        { text: 'Gran ayuda, pero se mantiene sentado', score: 5 },
                        { text: 'Dependiente', score: 0 }
                    ], required: true
                },
                {
                    id: 'bt_deambular', label: '9. Deambular', type: 'scored-option-list', options: [
                        { text: 'Independiente, camina solo 50 metros', score: 15 },
                        { text: 'Necesita ayuda o supervisión', score: 10 },
                        { text: 'Independiente en silla de ruedas', score: 5 },
                        { text: 'Dependiente', score: 0 }
                    ], required: true
                },
                {
                    id: 'bt_escalones', label: '10. Escalones', type: 'scored-option-list', options: [
                        { text: 'Independiente', score: 10 },
                        { text: 'Necesita ayuda o supervisión', score: 5 },
                        { text: 'Dependiente', score: 0 }
                    ], required: true
                }
            ]
        },
        {
            title: '🧮 RESULTADO AUTOMÁTICO',
            fields: [
                { id: 'bt_total', label: 'Puntaje Total', type: 'total-score', sourcePrefix: 'bt_', readonly: true },
                { id: 'bt_resultado', label: 'Interpretación de dependencia', type: 'barthel-result' },
                { id: 'bt_nota', label: '', type: 'info-text', text: '📌 Máxima puntuación: 100 puntos (90 si el paciente usa silla de ruedas)' },
                { id: 'bt_obs', label: 'Observaciones del profesional', type: 'textarea' }
            ]
        }
    ]
};

const testMMSE = {
    title: 'Mini Mental State Examination (MMSE) – Versión Clínica Corregida',
    sections: [
        {
            title: '🔹 I. ORIENTACIÓN TEMPORAL (Máx. 5 pts)',
            fields: [
                { id: 'mm_i1', type: 'info-block', text: '📌 Instrucción: Realizar preguntas directamente al paciente y evaluar si responde correctamente (1 pto cada una).' },
                { id: 'mm_t1', label: '¿En qué año estamos?', type: 'mmse-row' },
                { id: 'mm_t2', label: '¿En qué estación estamos?', type: 'mmse-row' },
                { id: 'mm_t3', label: '¿En qué día (fecha)?', type: 'mmse-row' },
                { id: 'mm_t4', label: '¿En qué mes?', type: 'mmse-row' },
                { id: 'mm_t5', label: '¿En qué día de la semana?', type: 'mmse-row' }
            ]
        },
        {
            title: '🔹 II. ORIENTACIÓN ESPACIAL (Máx. 5 pts)',
            fields: [
                { id: 'mm_i2', type: 'info-block', text: '📌 Instrucción: Evaluar orientación del paciente en el entorno actual (1 pto cada una).' },
                { id: 'mm_e1', label: '¿En qué lugar estamos?', type: 'mmse-row' },
                { id: 'mm_e2', label: '¿En qué piso o planta?', type: 'mmse-row' },
                { id: 'mm_e3', label: '¿En qué ciudad?', type: 'mmse-row' },
                { id: 'mm_e4', label: '¿En qué comuna?', type: 'mmse-row' },
                { id: 'mm_e5', label: '¿En qué país?', type: 'mmse-row' }
            ]
        },
        {
            title: '🔹 III. FIJACIÓN / MEMORIA INMEDIATA (Máx. 3 pts)',
            fields: [
                { id: 'mm_i3', type: 'info-block', text: '📌 Instrucción: Nombre tres palabras claramente (1/seg). Pida repetirlas. Solo la primera repetición otorga puntaje. Máx 6 intentos.' },
                { id: 'mm_f_serie', label: 'Selección de serie:', type: 'radio', options: ['Peseta – Caballo – Manzana', 'Balón – Bandera – Árbol'], required: true },
                { id: 'mm_f1', label: '1. Peseta o Balón', type: 'mmse-row' },
                { id: 'mm_f2', label: '2. Caballo o Bandera', type: 'mmse-row' },
                { id: 'mm_f3', label: '3. Manzana o Árbol', type: 'mmse-row' },
                { id: 'mm_f_rep', label: 'Número de repeticiones necesarias (1-6):', type: 'number', min: 1, max: 6, required: true },
                { id: 'mm_f_nota', type: 'info-text', text: '⚠️ Nota: El puntaje corresponde SOLO a la primera repetición.' }
            ]
        },
        {
            title: '🔹 IV. ATENCIÓN Y CÁLCULO (Máx. 5 pts)',
            fields: [
                { id: 'mm_i4', type: 'info-block', text: '📌 Instrucción: Solicite restar de 3 en 3 desde 30. Si no puede, deletrear MUNDO al revés.' },
                { id: 'mm_c_metodo', label: 'Selección de método:', type: 'radio', options: ['Método A: Restas', 'Método B: MUNDO'], required: true },
                // Método A
                { id: 'mm_ca_1', label: '27', type: 'mmse-row', condition: { field: 'mm_c_metodo', value: 'Método A: Restas' } },
                { id: 'mm_ca_2', label: '24', type: 'mmse-row', condition: { field: 'mm_c_metodo', value: 'Método A: Restas' } },
                { id: 'mm_ca_3', label: '21', type: 'mmse-row', condition: { field: 'mm_c_metodo', value: 'Método A: Restas' } },
                { id: 'mm_ca_4', label: '18', type: 'mmse-row', condition: { field: 'mm_c_metodo', value: 'Método A: Restas' } },
                { id: 'mm_ca_5', label: '15', type: 'mmse-row', condition: { field: 'mm_c_metodo', value: 'Método A: Restas' } },
                // Método B
                { id: 'mm_cb_1', label: 'O', type: 'mmse-row', condition: { field: 'mm_c_metodo', value: 'Método B: MUNDO' } },
                { id: 'mm_cb_2', label: 'D', type: 'mmse-row', condition: { field: 'mm_c_metodo', value: 'Método B: MUNDO' } },
                { id: 'mm_cb_3', label: 'N', type: 'mmse-row', condition: { field: 'mm_c_metodo', value: 'Método B: MUNDO' } },
                { id: 'mm_cb_4', label: 'U', type: 'mmse-row', condition: { field: 'mm_c_metodo', value: 'Método B: MUNDO' } },
                { id: 'mm_cb_5', label: 'M', type: 'mmse-row', condition: { field: 'mm_c_metodo', value: 'Método B: MUNDO' } }
            ]
        },
        {
            title: '🔹 V. RECUERDO DIFERIDO (Máx. 3 pts)',
            fields: [
                { id: 'mm_i5', type: 'info-block', text: '📌 Instrucción: Preguntar por las 3 palabras utilizadas anteriormente.' },
                { id: 'mm_r1', label: '1. Peseta o Balón', type: 'scored-yesno', yesScore: 1, noScore: 0 },
                { id: 'mm_r2', label: '2. Caballo o Bandera', type: 'scored-yesno', yesScore: 1, noScore: 0 },
                { id: 'mm_r3', label: '3. Manzana o Árbol', type: 'scored-yesno', yesScore: 1, noScore: 0 }
            ]
        },
        {
            title: '🔹 VI. LENGUAJE Y PRAXIA (Máx. 9 pts)',
            fields: [
                { id: 'mm_i6a', type: 'info-block', text: '🔸 1. DENOMINACIÓN: Mostrar objetos y preguntar ¿Qué es esto?' },
                { id: 'mm_l1', label: 'Lápiz', type: 'mmse-row' },
                { id: 'mm_l2', label: 'Reloj', type: 'mmse-row' },

                { id: 'mm_i6b', type: 'info-block', text: '🔸 2. REPETICIÓN: Repetir frase "Ni sí, ni no, ni pero" o "En un trigal habían 5 perros".' },
                { id: 'mm_l3', label: 'Repetición correcta', type: 'mmse-row' },

                { id: 'mm_i6c', type: 'info-block', text: '🔸 3. ÓRDENES: "Tome un papel con la mano derecha, dóblelo por la mitad y póngalo en el suelo"' },
                { id: 'mm_ord', label: 'Ejecución:', type: 'checkbox', options: ['Toma papel (1)', 'Dobla papel (1)', 'Coloca en suelo (1)'] },
                { id: 'mm_l4', type: 'hidden-score', sourceCheckbox: 'mm_ord', count: true }, // Logic to sum these

                { id: 'mm_i6d', type: 'info-block', text: '🔸 4. LECTURA: Escriba legiblemente en un papel "Cierre los ojos". Pídale que lo lea y haga lo que dice la frase.' },
                { id: 'mm_l7', label: 'Ejecuta correctamente', type: 'mmse-row' },

                { id: 'mm_i6e', type: 'info-block', text: '🔸 5. ESCRITURA: "Escriba una frase con sentido (con sujeto y predicado)"' },
                { id: 'mm_l8', label: 'Escritura correcta', type: 'mmse-row' },

                { id: 'mm_i6f', type: 'info-block', text: '🔸 6. PRAXIA: "Dibuje 2 pentágonos intersectados y pida al sujeto que los copie tal cual. Para otorgar un punto deben estar presentes los 10 ángulos y la intersección"' },
                { id: 'mm_l9', label: 'Copia correcta', type: 'mmse-row' }
            ]
        },
        {
            title: '🧮 RESULTADO FINAL',
            fields: [
                { id: 'mm_total', label: 'Puntaje Total MMSE', type: 'total-score', sourcePrefix: 'mm_', readonly: true },
                { id: 'mm_resultado', label: 'Interpretación MMSE', type: 'mmse-result' },
                { id: 'mm_obs', label: 'Observaciones del profesional', type: 'textarea' }
            ]
        }
    ]
};

const testsConfig = {
    'eval-psicologica': testEvalPsicologica,
    'eval-to': testTO,
    'lawton-brody': testLawtonBrody,
    'yesavage': testYesavage,
    'barthel': testBarthel,
    'hamilton-ansiedad': testHamiltonAnsiedad,
    'mmse': testMMSE
};

// --- LOGICA DE SUPABASE ---
async function loadDataFromSupabase() {
    console.log("Cargando datos desde Supabase...");

    try {
        const pacientesRes = await db.from('pacientes').select('*');
        if (pacientesRes.error) throw pacientesRes.error;

        const visitasRes = await db
    .from('visitas')
    .select('id, paciente_id, num, fecha, tipo, hora_inicio, hora_termino, objetivo, actividades, observaciones, firma_nombre, firma_rut, relacion, profesional_nombre, profesional_area');

        
        const entregasRes = await db.from('entregas').select('*');
        const documentosRes = await db.from('documentos').select('*');

       const pData = pacientesRes.data || [];
        const vData = visitasRes.error ? [] : (visitasRes.data || []);
        const eData = entregasRes.error ? [] : (entregasRes.data || []);
        const dData = documentosRes.error ? [] : (documentosRes.data || []);

        console.log("PACIENTES DATA:", pData);
        console.log("VISITAS DATA:", vData);
        console.log("DOCUMENTOS DATA:", dData);

        if (visitasRes.error) {
            console.warn("No se pudieron cargar visitas:", visitasRes.error.message);
        }
        if (entregasRes.error) {
            console.warn("No se pudieron cargar entregas:", entregasRes.error.message);
        }
        if (documentosRes.error) {
            console.warn("No se pudieron cargar formularios/encuestas desde Supabase:", documentosRes.error.message);
        }

     patients = pData.map(p => {
    const firmaProfDocumentosPaciente = dData.filter(d =>
    String(d.paciente_id) === String(p.id) &&
    d.test_id === 'firma-profesional-visita'
    );

    const visitasPaciente = vData
    .filter(v => String(v.paciente_id) === String(p.id))
        .map(v => ({
            id: v.id,
            num: v.num,
            fecha: v.fecha,
            tipo: v.tipo,
            horaI: v.hora_inicio,
            horaT: v.hora_termino,
            objetivo: v.objetivo,
            actividades: v.actividades,
            obs: v.observaciones,
            firma: null,
            firmaProf: getFirmaProfesionalVisitaFromDocumentos(v, firmaProfDocumentosPaciente) || null,
            firmaTipo: 'manual',
            firmaNombre: v.firma_nombre,
            firmaRut: v.firma_rut,
            relacion: v.relacion,
            profesionalNombre: v.profesional_nombre,
            profesional: v.profesional_area
        }));

           const entregasPaciente = eData
                .filter(e => String(e.paciente_id) === String(p.id))
                .map(e => ({
                    id: e.id,
                    tipo: e.articulo_tipo,
                    desc: e.descripcion,
                    estado: e.estado || 'Nuevo',
                    fecha: e.fecha,
                    prof: e.profesional,
                    firma: e.firma_paciente_base64,
                    firmaProf: e.firma_profesional_base64,
                    firmanteNombre: e.firmante_nombre,
                    firmaRut: e.firmante_rut,
                    relacion: e.relacion
                }));

            const documentosPaciente = mergeDocs(
            dData
                .filter(d => String(d.paciente_id) === String(p.id))
                .map(mapDocumentoFromSupabase),
              loadLocalDocsForPatient(p.id)
            );

            return {
                id: p.id,
                nombre: p.nombre || '',
                rut: p.rut || '',
                edad: p.edad || '',
                fechaNacimiento: p.fecha_nacimiento || '',
                domicilio: p.domicilio || '',
                telefono: p.telefono || '',
                ultimaVisita: p.ultima_visita || '',
                visitas: visitasPaciente,
                entregas: entregasPaciente,
                docs: documentosPaciente
            };
        });
        console.log("PACIENTES CON VISITAS:", patients.map(p => ({
        nombre: p.nombre,
        id: p.id,
        visitas: p.visitas.length,
        docs: p.docs.length
        })));
        
        savePatients();
        renderTable();
        console.log("Pacientes cargados correctamente:", patients.length);
    } catch (err) {
        console.error("Error cargando pacientes desde Supabase:", err);
        patients = JSON.parse(localStorage.getItem('tera_patients')) || [];
        renderTable();
    }
}

// Llamar al cargar la página
window.addEventListener('DOMContentLoaded', async () => {
    if (!db.auth) return;
    const { data } = await db.auth.getSession();
    if (data && data.session) {
        isAuthenticated = true;
        currentUser = data.session.user;
        applyCurrentUserProfessionalProfile();
        await loadDataFromSupabase();
    }
});

async function savePatients() {
    try {
        // Guardar solo respaldo liviano, sin firmas ni docs pesados
        const lightweightPatients = (patients || []).map(p => ({
            id: p.id,
            nombre: p.nombre || '',
            rut: p.rut || '',
            edad: p.edad || '',
            fechaNacimiento: p.fechaNacimiento || '',
            domicilio: p.domicilio || '',
            telefono: p.telefono || '',
            ultimaVisita: p.ultimaVisita || ''
        }));

        localStorage.setItem('tera_patients', JSON.stringify(lightweightPatients));
    } catch (error) {
        console.warn('No se pudo guardar tera_patients en localStorage:', error);
    }

    try {
        saveAllDocsLocalBackups();
    } catch (error) {
        console.warn('No se pudieron guardar respaldos locales de documentos:', error);
    }
}

function loadLocalDocsForPatient(patientId) {
    try {
        return JSON.parse(localStorage.getItem(`docs_${patientId}`) || '[]');
    } catch (error) {
        console.warn('No se pudo leer el respaldo local de documentos:', error);
        return [];
    }
}

function saveLocalDocsForPatient(patientId, docs) {
    try {
        localStorage.setItem(`docs_${patientId}`, JSON.stringify(docs || []));
    } catch (error) {
        console.warn('No se pudo guardar el respaldo local de documentos:', error);
    }
}

function saveAllDocsLocalBackups() {
    if (!Array.isArray(patients)) return;
    patients.forEach(p => saveLocalDocsForPatient(p.id, p.docs || []));
}

function mergeDocs(primaryDocs, backupDocs) {
    const byId = new Map();
    [...(backupDocs || []), ...(primaryDocs || [])].forEach(doc => {
        if (!doc) return;
        const id = doc.id || `doc-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        byId.set(id, { ...doc, id });
    });
    return Array.from(byId.values()).sort((a, b) => {
        const aDate = Date.parse(a.fechaGuardado || a.createdAt || a.fecha || '') || 0;
        const bDate = Date.parse(b.fechaGuardado || b.createdAt || b.fecha || '') || 0;
        return bDate - aDate;
    });
}

function mapDocumentoFromSupabase(d) {
    return {
        id: d.id,
        testId: d.test_id,
        titulo: d.titulo || '',
        contenido: d.contenido || '',
        rawData: d.raw_data || {},
        fecha: d.fecha || '',
        fechaGuardado: d.fecha_guardado || '',
        profesional: d.profesional || '',
        isTest: d.is_test !== false,
        estado: d.estado || 'finalizado',
        editable: !!d.editable,
        firma: d.firma || null,
        firmaNombre: d.firma_nombre || '',
        firmaRut: d.firma_rut || '',
        firmaRelacion: d.firma_relacion || '',
        createdAt: d.created_at,
        updatedAt: d.updated_at
    };
}

function getFirmaProfesionalVisitaFromDocumentos(visita, docs) {
    const doc = (docs || []).find(d => {
        const raw = d.raw_data || {};
        return raw.visitaId === visita.id || Number(raw.visitaNum) === Number(visita.num);
    });
    return doc && doc.raw_data ? doc.raw_data.firmaProf || '' : '';
}

async function syncFirmaProfesionalVisitaDocumento(visita, patientId, firmaProfBase64) {
    if (!visita || !visita.id || !firmaProfBase64) return null;

    return syncDocumentoToSupabase({
        id: `firma-prof-visita-${visita.id}`,
        testId: 'firma-profesional-visita',
        titulo: `Firma profesional visita ${visita.num || ''}`.trim(),
        contenido: 'Respaldo de firma profesional de acta de visita.',
        rawData: {
            visitaId: visita.id,
            visitaNum: visita.num,
            firmaProf: firmaProfBase64
        },
        fecha: visita.fecha || new Date().toLocaleDateString('es-CL'),
        fechaGuardado: new Date().toISOString(),
        profesional: visita.profesional_nombre || visita.profesionalNombre || currentProfesionalNombre || '',
        isTest: false,
        estado: 'finalizado',
        editable: false
    }, patientId);
}

function normalizeDocumentoForSupabase(doc, patientId) {
    return {
        id: doc.id,
        paciente_id: patientId,
        test_id: doc.testId || null,
        titulo: doc.titulo || '',
        contenido: doc.contenido || '',
        raw_data: doc.rawData || {},
        fecha: doc.fecha || null,
        fecha_guardado: doc.fechaGuardado || null,
        profesional: doc.profesional || null,
        estado: doc.estado || 'finalizado',
        editable: !!doc.editable,
        is_test: doc.isTest !== false,
        firma: doc.firma || null,
        firma_nombre: doc.firmaNombre || null,
        firma_rut: doc.firmaRut || null,
        firma_relacion: doc.firmaRelacion || null,
        updated_at: new Date().toISOString()
    };
}

async function syncDocumentoToSupabase(doc, patientId) {
    const payload = normalizeDocumentoForSupabase(doc, patientId);
    const { data, error } = await db
        .from('documentos')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

    if (error) {
        console.error('Error sincronizando formulario/encuesta:', error);
        alert('El formulario quedo respaldado localmente, pero no se pudo guardar en Supabase: ' + error.message);
        return null;
    }

    return mapDocumentoFromSupabase(data);
}

async function deleteDocumentoFromSupabase(docId) {
    const { error } = await db.from('documentos').delete().eq('id', docId);
    if (error) {
        console.error('Error eliminando documento en Supabase:', error);
        alert('No se pudo eliminar el documento en Supabase: ' + error.message);
        return false;
    }
    return true;
}


//funcion para carga una visita completa cuando haga falta
async function loadFullVisitaById(visitaId) {
    const { data, error } = await db
        .from('visitas')
        .select('*')
        .eq('id', visitaId)
        .single();

    if (error) {
        console.error('Error cargando visita completa:', error);
        return null;
    }

    return data;
}

// Función específica para guardar un paciente en Supabase
async function syncPatientToSupabase(p) {
    const pData = {
        nombre: p.nombre || '',
        rut: p.rut || null,
        edad: p.edad || null,
        fecha_nacimiento: p.fechaNacimiento || null,
        domicilio: p.domicilio || null,
        telefono: p.telefono || null,
        ultima_visita: p.ultimaVisita || null
    };

    let response;

    if (p.id) {
        response = await db
            .from('pacientes')
            .update(pData)
            .eq('id', p.id)
            .select()
            .single();
    } else {
        response = await db
            .from('pacientes')
            .insert(pData)
            .select()
            .single();
    }

    const { data, error } = response;

    if (error) {
        console.error("Error sincronizando paciente:", error);
        alert("Error al guardar en Supabase: " + error.message);
        return null;
    }

    return data;
}
async function syncVisitaToSupabase(v, patientId) {
    const payload = {
        paciente_id: patientId,
        num: v.num,
        fecha: v.fecha,
        tipo: v.tipo,
        hora_inicio: v.horaI,
        hora_termino: v.horaT,
        objetivo: v.objetivo,
        actividades: v.actividades,
        observaciones: v.obs,
        firma: v.firma,
        firma_profesional_base64: v.firmaProf,
        firma_nombre: v.firmaNombre,
        firma_rut: v.firmaRut,
        relacion: v.relacion,
        profesional_nombre: v.profesionalNombre,
        profesional_area: v.profesional
    };

    let response;

    if (v.id) {
        response = await db
            .from('visitas')
            .update(payload)
            .eq('id', v.id)
            .select()
            .single();
    } else {
        response = await db
            .from('visitas')
            .insert(payload)
            .select()
            .single();
    }

    let { data, error } = response;

    if (error) {
        console.error("Error sincronizando visita:", error);
        alert("Error al guardar visita en Supabase: " + error.message);
        return null;
    }

    return data;
}


async function syncEntregaToSupabase(e, patientId) {
    const payload = {
        paciente_id: patientId,
        articulo_tipo: e.tipo,
        descripcion: e.desc,
        estado: e.estado,
        fecha: e.fecha,
        profesional: e.prof,
        firma_paciente_base64: e.firma,
        firma_profesional_base64: e.firmaProf || null,
        firmante_nombre: e.firmanteNombre,
        firmante_rut: e.firmaRut,
        relacion: e.relacion
    };

    console.log("Payload entrega:", payload);

    const { data, error } = await db
        .from('entregas')
        .insert(payload)
        .select()
        .single();

    if (error) {
        console.error("Error sincronizando entrega:", error);
        alert("❌ Error al guardar entrega en Supabase: " + error.message);
        return null;
    }

    return data;
}


async function syncFirmaProfesionalEntrega(entregaId, firmaProfBase64) {
    const { error } = await db
        .from('entregas')
        .update({ firma_profesional_base64: firmaProfBase64 })
        .eq('id', entregaId);

    if (error) {
        console.error("Error sincronizando firma profesional:", error);
        alert("❌ No se pudo guardar la firma profesional en Supabase.");
        return false;
    }

    return true;
}

function mapVisitaFromSupabase(v) {
    return {
        id: v.id,
        num: v.num,
        fecha: v.fecha,
        tipo: v.tipo,
        horaI: v.hora_inicio,
        horaT: v.hora_termino,
        objetivo: v.objetivo,
        actividades: v.actividades,
        obs: v.observaciones,
        firma: v.firma,
        firmaProf: v.firma_profesional_base64,
        firmaTipo: 'manual',
        firmaNombre: v.firma_nombre,
        firmaRut: v.firma_rut,
        relacion: v.relacion,
        profesionalNombre: v.profesional_nombre,
        profesional: v.profesional_area
    };
}

function mapEntregaFromSupabase(e) {
    return {
        id: e.id,
        tipo: e.articulo_tipo,
        desc: e.descripcion,
        estado: e.estado || 'Nuevo',
        fecha: e.fecha,
        prof: e.profesional,
        firma: e.firma_paciente_base64,
        firmaProf: e.firma_profesional_base64,
        firmanteNombre: e.firmante_nombre,
        firmaRut: e.firmante_rut,
        relacion: e.relacion
    };
}

function calcularUltimaVisitaDesdeVisitas(visitas) {
    if (!visitas || visitas.length === 0) return '';

    const ultima = [...visitas].sort((a, b) =>
        b.fecha.localeCompare(a.fecha)
    )[0];

    return ultima.fecha || '';
}

async function loadFullVisitaById(visitaId) {
    const { data, error } = await db
        .from('visitas')
        .select('*')
        .eq('id', visitaId)
        .single();

    if (error) {
        console.error('Error cargando visita completa:', error);
        return null;
    }

    return data;
}

async function actualizarUltimaVisitaPaciente(p) {
    const ultimaFechaISO = calcularUltimaVisitaDesdeVisitas(p.visitas);

    p.ultimaVisita = ultimaFechaISO;

    const { error } = await db
        .from('pacientes')
        .update({ ultima_visita: ultimaFechaISO || null })
        .eq('id', p.id);

    if (error) {
        console.error("Error actualizando última visita:", error);
        return false;
    }

    return true;
}

function formatFechaDisplay(fecha) {
    if (!fecha) return 'Sin visitas';

    if (fecha.includes('/')) return fecha;

    const partes = fecha.split('-');
    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    return fecha;
} 

// Renderizar tabla
function renderTable(filter = '') {
    const tbody = document.getElementById('patientsList');
    tbody.innerHTML = '';

    const filtered = patients.filter(p =>
        p.nombre.toLowerCase().includes(filter.toLowerCase()) ||
        p.rut.toLowerCase().includes(filter.toLowerCase())
    );

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 30px; color: var(--text-tertiary);">No se encontraron pacientes registrados.</td></tr>';
        return;
    }

    filtered.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${p.nombre}</strong></td>
            <td>${p.rut}</td>
            <td>${formatFechaDisplay(p.ultimaVisita)}</td>
            <td>
                <button class="action-btn" onclick="askProfesional('${p.id}')">Evaluación</button>
               <button class="action-btn" onclick="editPatient('${p.id}')">Editar</button>
                <button class="action-btn delete" onclick="deletePatient('${p.id}')">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function calculateAge(birthday) {
    if (!birthday) return '';
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

// Búsqueda
document.getElementById('searchInput').addEventListener('input', (e) => renderTable(e.target.value));

// Modales (Abrir y Cerrar)
function showAddPatientModal() {
    document.getElementById('patientForm').reset();
    document.getElementById('patientId').value = '';
    document.getElementById('modalTitle').textContent = 'Nuevo Paciente';
    document.getElementById('patientModal').classList.add('active');
}

function editPatient(id) {
    const p = patients.find(x => x.id === id);
    if (!p) return;

    document.getElementById('patientId').value = p.id || '';
    document.getElementById('pNombre').value = p.nombre || '';
    document.getElementById('pEdad').value = p.edad || '';
    document.getElementById('pRut').value = p.rut || '';
    document.getElementById('pFecha').value = p.fechaNacimiento || '';
    document.getElementById('pDomicilio').value = p.domicilio || '';
    document.getElementById('pTelefono').value = p.telefono || '';

    document.getElementById('modalTitle').textContent = 'Editar Paciente';
    document.getElementById('patientModal').classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    if (id === 'testModal') {
        currentDraftId = null;
    }
    if (id === 'sessionModal') {
        stopCamera();
    }
}

async function signInWithSupabase(username, password) {
    if (!db.auth) return null;
    const normalizedUser = (username || '').trim();
    if (!normalizedUser) return null;

    const email = normalizedUser.includes('@')
        ? normalizedUser
        : `${normalizedUser}@salud360.local`;

    const { data, error } = await db.auth.signInWithPassword({
        email,
        password
    });

    if (error || !data || !data.user) {
        console.warn('Supabase Auth no pudo iniciar sesion:', error?.message || 'sin usuario');
        return null;
    }

    return {
        username: normalizedUser,
        nombre: data.user.user_metadata?.nombre || normalizedUser,
        supabaseUser: data.user
    };
}

function getCurrentUsername() {
    if (!currentUser) return '';
    if (currentUser.username) return currentUser.username.toLowerCase();
    if (currentUser.email) return currentUser.email.split('@')[0].toLowerCase();
    if (currentUser.supabaseUser && currentUser.supabaseUser.email) {
        return currentUser.supabaseUser.email.split('@')[0].toLowerCase();
    }
    return '';
}

function getCurrentUserProfile() {
    return USER_PROFILES[getCurrentUsername()] || null;
}

function isCurrentUserAdmin() {
    return getCurrentUsername() === 'admi';
}

function applyCurrentUserProfessionalProfile() {
    const profile = getCurrentUserProfile();
    if (!profile) return false;

    currentProfesional = profile.area;
    currentProfesionalNombre = profile.nombre;
    updateSystemProfesionalSelects();
    return true;
}

// Auto-calcular edad en el formulario de paciente
document.getElementById('pFecha').addEventListener('change', (e) => {
    const age = calculateAge(e.target.value);
    if (age !== '') {
        document.getElementById('pEdad').value = age;
    }
});

// Guardar Paciente
document.getElementById('patientForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('patientId').value || null;
    const nombre = document.getElementById('pNombre').value;
    const edad = document.getElementById('pEdad').value;
    const rut = document.getElementById('pRut').value;
    const fechaNav = document.getElementById('pFecha').value;
    const domicilio = document.getElementById('pDomicilio').value;
    const telefono = document.getElementById('pTelefono').value;

    const pObj = {
        id,
        nombre,
        edad,
        rut,
        fechaNacimiento: fechaNav,
        domicilio,
        telefono,
        ultimaVisita: ''
    };

    const savedPatient = await syncPatientToSupabase(pObj);
    if (!savedPatient) return;

    const existingIndex = patients.findIndex(p => p.id === id);

    const finalPatient = {
        id: savedPatient.id,
        nombre: savedPatient.nombre,
        edad: savedPatient.edad,
        rut: savedPatient.rut,
        fechaNacimiento: savedPatient.fecha_nacimiento,
        domicilio: savedPatient.domicilio,
        telefono: savedPatient.telefono,
        ultimaVisita: savedPatient.ultima_visita || '',
        visitas: existingIndex >= 0 ? patients[existingIndex].visitas : [],
        entregas: existingIndex >= 0 ? patients[existingIndex].entregas : [],
        docs: existingIndex >= 0 ? patients[existingIndex].docs : []
    };

    if (existingIndex >= 0) {
        patients[existingIndex] = finalPatient;
    } else {
        patients.push(finalPatient);
    }

    savePatients();
    renderTable();
    closeModal('patientModal');
    alert("✅ Paciente guardado correctamente.");
});

// Eliminar Paciente
async function deletePatient(id) {
    if (confirm('¿Seguro que deseas eliminar a este paciente y todos sus registros? Esta acción no se puede deshacer.')) {
        const { error } = await db.from('pacientes').delete().eq('id', id);
        if (error) {
            alert("Error al eliminar en Supabase: " + error.message);
            return;
        }
        patients = patients.filter(p => p.id !== id);
        savePatients();
        renderTable();
    }
}

// --- FICHA DEL PACIENTE Y DOCUMENTOS ---
let tempArea = '';
function askProfesional(id) {
    currentPatientId = id;
    if (applyCurrentUserProfessionalProfile()) {
        openFicha(id);
        return;
    }

    document.getElementById('profStep1').style.display = 'flex';
    document.getElementById('profStep2').style.display = 'none';
    document.getElementById('profesionalModal').classList.add('active');
}

function selectArea(area) {
    tempArea = area;
    const names = PROFESIONALES_LISTA[area];
    const select = document.getElementById('profNameSelect');
    if (select) {
        select.innerHTML = '';
        names.forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            select.appendChild(opt);
        });
    }
    document.getElementById('profStep1').style.display = 'none';
    document.getElementById('profStep2').style.display = 'block';
}

function backToStep1() {
    document.getElementById('profStep1').style.display = 'flex';
    document.getElementById('profStep2').style.display = 'none';
}

function confirmProfesional() {
    const nameSelect = document.getElementById('profNameSelect');
    const name = nameSelect ? nameSelect.value : '';
    if (!name) {
        alert("Por favor seleccione su nombre.");
        return;
    }
    currentProfesional = tempArea;
    currentProfesionalNombre = name;

    // Poblar todos los selects del sistema
    updateSystemProfesionalSelects();

    closeModal('profesionalModal');
    if (currentPatientId) {
        openFicha(currentPatientId);
    }
}

function updateSystemProfesionalSelects() {
    const sTipo = document.getElementById('sTipo');
    if (sTipo) {
        sTipo.value = currentProfesional === 'psicologo' ? 'Psicología' : 'Terapia Ocupacional';
    }

    populateProfesionalDropdown('sProfesionalNombre', currentProfesional);
    populateProfesionalDropdown('artProf', 'terapeuta'); // Los artículos los maneja TO
}

function populateProfesionalDropdown(selectId, area) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const names = PROFESIONALES_LISTA[area] || [];
    select.innerHTML = '';
    names.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
    });

    if (area === currentProfesional && names.includes(currentProfesionalNombre)) {
        select.value = currentProfesionalNombre;
    }
}

// Listener para cambio de especialidad en el formulario de sesiones
document.addEventListener('DOMContentLoaded', () => {
    // Migrar nombres antiguos para consistencia
    migrateProfessionalNames();

    const sTipo = document.getElementById('sTipo');
    if (sTipo) {
        sTipo.addEventListener('change', (e) => {
            const area = e.target.value === 'Psicología' ? 'psicologo' : 'terapeuta';
            populateProfesionalDropdown('sProfesionalNombre', area);
        });
    }

    // Login Form Listener
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = document.getElementById('loginUser').value;
            const pass = document.getElementById('loginPass').value;
            const errorEl = document.getElementById('loginError');

            const authUser = await signInWithSupabase(user, pass);
            const allowLegacyLogin = !db.auth;
            const found = authUser || (allowLegacyLogin ? users.find(u => u.username === user && u.password === pass) : null);
            if (found) {
                isAuthenticated = true;
                currentUser = found;
                applyCurrentUserProfessionalProfile();
                errorEl.style.display = 'none';
                await loadDataFromSupabase();
                closeModal('loginModal');

                // Mostrar sección de sistema
                const systemSection = document.getElementById('sistema');
                systemSection.style.display = 'block';

                // Ir al sistema
                setTimeout(() => {
                    systemSection.scrollIntoView({ behavior: 'smooth' });
                }, 300);
            } else {
                errorEl.style.display = 'block';
            }
        });
    }
});

function logout() {
    if (db.auth) db.auth.signOut();
    isAuthenticated = false;
    currentUser = null;
    document.getElementById('sistema').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    alert('Sesión cerrada correctamente.');
}

function normalizeName(name) {
    if (!name || typeof name !== 'string') return name;

    const exactMatches = {
        "VICENTE ACUÑA BAGIOLI": "Vicente Acuña Bagioli",
        "CONSTANZA HIDALGO CÁRDENAS": "Constanza Hidalgo Cárdenas",
        "NATALY MERSEY ORTEGA" : "Nataly Mersey Ortega",
        "CINDIE PALMA ARANEDA" : "Cindie Palma Araneda",
        "ANRIETTE FARIÑA": "Anriette Fariña",
        "JACINTA NOGUERA BARTHOU": "Jacinta Noguera Barthou"
    };

    const upper = name.toUpperCase().trim().replace(/\s+/g, ' ');
    if (exactMatches[upper]) return exactMatches[upper];

    // Capitalización estándar si no está en la lista exacta
    return name.toLowerCase().trim().replace(/\s+/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function migrateProfessionalNames() {
    if (!patients) return;
    patients.forEach(p => {
        if (p.visitas) {
            p.visitas.forEach(v => {
                if (v.profesionalNombre) v.profesionalNombre = normalizeName(v.profesionalNombre);
            });
        }
        if (p.entregas) {
            p.entregas.forEach(e => {
                if (e.prof) e.prof = normalizeName(e.prof);
            });
        }
        if (p.docs) {
            p.docs.forEach(d => {
                if (d.profesional) d.profesional = normalizeName(d.profesional);
            });
        }
    });
    savePatients();
}

function openFicha(id) {
    const p = patients.find(p => p.id === id);
    const area = currentProfesional === 'psicologo' ? 'Psicología' : 'Terapia Ocupacional';
    const profLabel = `${area}${currentProfesionalNombre ? ' - ' + currentProfesionalNombre : ''}`;

    document.getElementById('fNombre').textContent = `${p.nombre} (${profLabel})`;
    document.getElementById('fDetails').innerHTML = `<strong>RUT:</strong> ${p.rut} | <strong>Edad:</strong> ${p.edad || '-'} | <strong>Nacimiento:</strong> ${p.fechaNacimiento} <br> <strong>Domicilio:</strong> ${p.domicilio || '-'}`;

    // --- MIGRACIÓN Y SEPARACIÓN DE DATOS (REQUERIMIENTO OBLIGATORIO) ---
    if (!p.visitas) p.visitas = [];
    if (!p.entregas) {
        p.entregas = [];
        // Mover entregas que estaban en docs a la nueva estructura
        if (p.docs) {
            const entregasEnDocs = p.docs.filter(d => d.tipo === 'Acta de Entrega');
            entregasEnDocs.forEach(e => {
                if (e.data) p.entregas.push({ ...e.data, id: e.id });
            });
            // Opcional: mantener docs limpios de actas de entrega si se desea, 
            // pero por seguridad de datos los dejamos por ahora.
        }
    }

    // Limpiar y llenar lista de tests
    const testList = document.getElementById('availableTestsList');
    testList.innerHTML = '';

    if (plantillasProfesionales[currentProfesional]) {
        plantillasProfesionales[currentProfesional].forEach(test => {
            const btn = document.createElement('button');
            btn.className = 'btn-outline';
            btn.style.fontSize = '0.85rem';
            btn.style.padding = '8px 16px';
            btn.innerHTML = `📝 ${test.nombre}`;
            btn.onclick = () => openTestForm(test.id);
            testList.appendChild(btn);
        });
    }

    document.getElementById('fichaModal').classList.add('active');
    currentPatientId = id;

    try {
        renderDocs();
        renderVisitas(); // Antes renderSessions

        const infoActa = document.getElementById('patientInfoActa');
        if (infoActa) {
            infoActa.innerHTML = `<strong>Paciente:</strong> ${p.nombre} | <strong>RUT:</strong> ${p.rut} | <strong>Domicilio:</strong> ${p.domicilio}`;
        }

        const secArt = document.getElementById('sectionArticulos');
        if (secArt) {
            secArt.style.display = (currentProfesional === 'terapeuta') ? 'block' : 'none';
        }

        // Update Print Header
        document.getElementById('prNombre').textContent = p.nombre;
        document.getElementById('prRut').textContent = p.rut;
        document.getElementById('prDireccion').textContent = p.domicilio;
        document.getElementById('prTelefono').textContent = p.telefono || 'No registrado';

        renderVisitas();
        renderArticulos();
    } catch (e) {
        console.error("Error rendering ficha content:", e);
    }
}



function openTestForm(testId, draftId = null) {
    currentTestId = testId;
    currentDraftId = draftId || null;
    console.log('Opening test:', testId);
    const config = testsConfig[testId];
    if (!config) {
        alert('Este formulario está en desarrollo.');
        return;
    }

    
    const titleEl = document.getElementById('testTitle');
    const subEl = document.getElementById('testSubtitle');
    if (titleEl) titleEl.textContent = config.title;
    if (subEl) subEl.textContent = `Especialidad: ${currentProfesional === 'psicologo' ? 'Psicología' : 'Terapia Ocupacional'}`;

    const container = document.getElementById('testFieldsContainer');
    if (!container) return;
    container.innerHTML = '';

    // Función auxiliar para renderizar un campo
    function renderField(f, container) {
        const fieldGroup = document.createElement('div');
        fieldGroup.className = 'form-group';
        fieldGroup.id = 'group_' + f.id;

        // Lógica condicional inicial (oculto si tiene condición)
        if (f.condition) {
            fieldGroup.style.display = 'none';
        }

        const label = document.createElement('label');
        label.textContent = f.label;
        label.style.fontWeight = '600';
        label.style.color = 'var(--primary-700)';
        fieldGroup.appendChild(label);

        if (f.type === 'text' || f.type === 'number' || f.type === 'date') {
            const input = document.createElement('input');
            input.type = f.type;
            input.id = f.id;
            input.className = 'form-input';
            input.required = f.required;
            fieldGroup.appendChild(input);
        } else if (f.type === 'textarea') {
            const input = document.createElement('textarea');
            input.id = f.id;
            input.className = 'form-input';
            input.rows = 3;
            input.required = f.required;
            fieldGroup.appendChild(input);
        } else if (f.type === 'select') {
            const input = document.createElement('select');
            input.id = f.id;
            input.className = 'form-input';
            input.required = f.required;
            f.options.forEach(opt => {
                const o = document.createElement('option');
                o.value = opt;
                o.textContent = opt;
                input.appendChild(o);
            });
            fieldGroup.appendChild(input);
        } else if (f.type === 'range') {
            const input = document.createElement('input');
            input.type = 'range';
            input.id = f.id;
            input.min = f.min;
            input.max = f.max;
            input.className = 'form-input';
            fieldGroup.appendChild(input);
        } else if (f.type === 'checkbox' || f.type === 'radio') {
            const optDiv = document.createElement('div');
            optDiv.className = 'opt-group-container';
            optDiv.style.display = 'flex';
            optDiv.style.flexDirection = 'column'; // Force vertical for clinical checklists
            optDiv.style.gap = '10px';
            optDiv.style.marginTop = '8px';

            f.options.forEach(opt => {
                const wrapper = document.createElement('label');
                wrapper.className = 'opt-wrapper';
                wrapper.style.display = 'flex';
                wrapper.style.alignItems = 'flex-start';
                wrapper.style.gap = '10px';
                wrapper.style.fontWeight = '400';
                wrapper.style.fontSize = '0.9rem';
                wrapper.style.cursor = 'pointer';
                wrapper.style.padding = '8px 12px';
                wrapper.style.borderRadius = '8px';
                wrapper.style.background = 'rgba(0,0,0,0.02)';
                wrapper.style.transition = 'background 0.2s';

                const input = document.createElement('input');
                input.type = f.type;
                input.name = f.id;
                input.value = opt;
                input.style.marginTop = '3px';

                // Evaluar condicionales en el cambio
                input.addEventListener('change', () => {
                    evaluateConditions(config);
                    // Visual feedback for selected
                    if (f.type === 'radio') {
                        optDiv.querySelectorAll('.opt-wrapper').forEach(w => w.style.background = 'rgba(0,0,0,0.02)');
                    }
                    wrapper.style.background = input.checked ? 'rgba(6, 182, 212, 0.1)' : 'rgba(0,0,0,0.02)';
                });

                const span = document.createElement('span');
                span.textContent = opt;
                span.style.flex = '1';

                wrapper.appendChild(input);
                wrapper.appendChild(span);
                optDiv.appendChild(wrapper);
            });
            fieldGroup.appendChild(optDiv);
        } else if (f.type === 'radio-grid') {
            const gridDiv = document.createElement('div');
            gridDiv.className = 'radio-grid-container';
            gridDiv.style.overflowX = 'auto';
            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            table.style.marginTop = '10px';

            // Header
            const thead = document.createElement('thead');
            const trHead = document.createElement('tr');
            trHead.innerHTML = `<th style="text-align: left; padding: 8px;">Actividad</th>`;
            f.options.forEach(opt => {
                trHead.innerHTML += `<th style="text-align: center; padding: 8px;">${opt}</th>`;
            });
            thead.appendChild(trHead);
            table.appendChild(thead);

            // Body
            const tbody = document.createElement('tbody');
            f.rows.forEach(row => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid rgba(0,0,0,0.05)';
                tr.innerHTML = `<td style="padding: 10px 8px; font-size: 0.9rem;">${row}</td>`;
                f.options.forEach(opt => {
                    const td = document.createElement('td');
                    td.style.textAlign = 'center';
                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = `${f.id}_${row.replace(/\s+/g, '')}`;
                    radio.value = opt;
                    td.appendChild(radio);
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            gridDiv.appendChild(table);
            fieldGroup.appendChild(gridDiv);
            fieldGroup.style.gridColumn = '1 / -1'; // Ocupa toda la fila
        } else if (f.type === 'scored-number') {
            // No mostrar label general para scored-number
            label.style.display = 'none';

            const inputDiv = document.createElement('div');
            inputDiv.style.display = 'flex';
            inputDiv.style.justifyContent = 'space-between';
            inputDiv.style.alignItems = 'center';
            inputDiv.style.borderBottom = '1px solid rgba(0,0,0,0.05)';
            inputDiv.style.paddingBottom = '10px';
            inputDiv.style.marginBottom = '5px';

            const textLabel = document.createElement('span');
            textLabel.textContent = f.label;
            textLabel.style.fontSize = '0.9rem';
            textLabel.style.color = 'var(--text-primary)';
            textLabel.style.flex = '1';

            const scoreInput = document.createElement('input');
            scoreInput.type = 'number';
            scoreInput.id = f.id;
            scoreInput.className = 'form-input score-input';
            scoreInput.min = 0;
            scoreInput.max = 8;
            scoreInput.required = f.required;
            scoreInput.style.width = '80px';
            scoreInput.style.padding = '8px';
            scoreInput.style.marginLeft = '15px';
            scoreInput.style.textAlign = 'center';
            scoreInput.placeholder = '0-8';

            scoreInput.addEventListener('input', () => calculateTotalScores(config));

            inputDiv.appendChild(textLabel);
            inputDiv.appendChild(scoreInput);
            fieldGroup.appendChild(inputDiv);
            fieldGroup.style.gridColumn = '1 / -1';
        } else if (f.type === 'scored-radio') {
            const optDiv = document.createElement('div');
            optDiv.style.display = 'flex';
            optDiv.style.flexDirection = 'column';
            optDiv.style.gap = '8px';
            optDiv.style.marginBottom = '15px';

            f.options.forEach(opt => {
                const wrapper = document.createElement('label');
                wrapper.style.display = 'flex';
                wrapper.style.alignItems = 'center';
                wrapper.style.gap = '8px';
                wrapper.style.fontWeight = '400';
                wrapper.style.fontSize = '0.9rem';

                const input = document.createElement('input');
                input.type = 'radio';
                input.name = f.id + '_radio';
                input.value = opt;
                input.required = f.required;

                input.addEventListener('change', () => {
                    const scoreInput = document.getElementById(f.id + '_score');
                    scoreInput.disabled = false;
                    scoreInput.focus();
                    calculateTotalScores(config);
                });

                wrapper.appendChild(input);
                wrapper.append(opt);
                optDiv.appendChild(wrapper);
            });
            fieldGroup.appendChild(optDiv);

            const scoreDiv = document.createElement('div');
            scoreDiv.style.display = 'flex';
            scoreDiv.style.alignItems = 'center';
            scoreDiv.style.gap = '10px';
            scoreDiv.style.background = 'rgba(6, 182, 212, 0.05)';
            scoreDiv.style.padding = '10px 15px';
            scoreDiv.style.borderRadius = '8px';

            const scoreLabel = document.createElement('label');
            scoreLabel.textContent = 'Ingrese puntaje manual (0-8):';
            scoreLabel.style.fontSize = '0.85rem';
            scoreLabel.style.margin = '0';

            const scoreInput = document.createElement('input');
            scoreInput.type = 'number';
            scoreInput.id = f.id + '_score';
            scoreInput.className = 'form-input score-input';
            scoreInput.min = 0;
            scoreInput.max = 8;
            scoreInput.required = f.required;
            scoreInput.disabled = true;
            scoreInput.style.width = '80px';
            scoreInput.style.padding = '8px';

            scoreInput.addEventListener('input', () => calculateTotalScores(config));

            scoreDiv.appendChild(scoreLabel);
            scoreDiv.appendChild(scoreInput);
            fieldGroup.appendChild(scoreDiv);
            fieldGroup.style.gridColumn = '1 / -1';

        } else if (f.type === 'total-score') {
            const input = document.createElement('input');
            input.type = 'text';
            input.id = f.id;
            input.className = 'form-input';
            input.readOnly = true;
            input.style.fontWeight = 'bold';
            input.style.fontSize = '1.5rem';
            input.style.color = 'var(--primary-600)';
            input.style.backgroundColor = 'rgba(6, 182, 212, 0.1)';
            input.style.textAlign = 'center';
            input.value = '0';
            fieldGroup.appendChild(input);
            fieldGroup.style.gridColumn = '1 / -1';
        } else if (f.type === 'dashboard-score') {
            label.style.display = 'none';
            const box = document.createElement('div');
            box.className = 'dashboard-score-card';
            box.innerHTML = `
                <div class="db-score-label">${f.label}</div>
                <input type="text" id="${f.id}" class="db-score-value" readonly value="0">
            `;
            fieldGroup.appendChild(box);
            // Default to partial width if needed, but let CSS handle it
        } else if (f.type === 'sex-selector') {
            label.style.marginBottom = '12px';
            label.style.fontSize = '1rem';
            const selectorDiv = document.createElement('div');
            selectorDiv.className = 'lb-sex-selector';

            const options = [
                { value: 'hombre', icon: '♂️', text: 'Hombre' },
                { value: 'mujer', icon: '♀️', text: 'Mujer' }
            ];

            options.forEach(opt => {
                const optWrapper = document.createElement('div');
                optWrapper.className = 'lb-sex-option';

                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = f.id;
                radio.id = f.id + '_' + opt.value;
                radio.value = opt.value;
                radio.required = f.required;

                radio.addEventListener('change', () => {
                    updateLawtonGuide(opt.value);
                    calculateTotalScores(config);
                });

                const lbl = document.createElement('label');
                lbl.className = 'lb-sex-label';
                lbl.setAttribute('for', f.id + '_' + opt.value);
                lbl.innerHTML = `<span class="lb-sex-icon">${opt.icon}</span> ${opt.text}`;

                optWrapper.appendChild(radio);
                optWrapper.appendChild(lbl);
                selectorDiv.appendChild(optWrapper);
            });

            fieldGroup.appendChild(selectorDiv);
            fieldGroup.style.gridColumn = '1 / -1';
        } else if (f.type === 'interpretation-guide') {
            label.style.display = 'none';
            const guideWrapper = document.createElement('div');
            guideWrapper.id = f.id;
            guideWrapper.style.gridColumn = '1 / -1';
            fieldGroup.appendChild(guideWrapper);
            fieldGroup.style.gridColumn = '1 / -1';
        } else if (f.type === 'suggested-classification') {
            label.style.display = 'none';
            const box = document.createElement('div');
            box.className = 'lb-classification-box';
            box.id = f.id;
            box.innerHTML = `
                <div class="lb-classification-label">📋 Clasificación sugerida (según sexo seleccionado)</div>
                <div class="lb-classification-value" id="${f.id}_value">Seleccione sexo para ver clasificación</div>
                <div class="lb-classification-note">Solo como guía informativa — no reemplaza el juicio clínico</div>
            `;
            fieldGroup.appendChild(box);
            fieldGroup.style.gridColumn = '1 / -1';
        } else if (f.type === 'scored-yesno') {
            label.style.display = 'none';

            const rowDiv = document.createElement('div');
            rowDiv.className = 'ys-question-row';

            const qText = document.createElement('span');
            qText.className = 'ys-question-text';
            qText.textContent = f.label;

            const btnGroup = document.createElement('div');
            btnGroup.className = 'ys-btn-group';

            const hiddenScore = document.createElement('input');
            hiddenScore.type = 'hidden';
            hiddenScore.id = f.id;
            hiddenScore.className = 'score-input';
            hiddenScore.value = '';

            [{ text: 'Sí', score: f.yesScore }, { text: 'No', score: f.noScore }].forEach(opt => {
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = f.id + '_yn';
                radio.id = f.id + '_' + opt.text.toLowerCase();
                radio.value = opt.text;
                // radio.required = f.required; // Removed to avoid non-focusable required field error
                radio.style.display = 'none';

                const lbl = document.createElement('label');
                lbl.className = 'ys-btn';
                lbl.setAttribute('for', radio.id);
                lbl.textContent = `${opt.text} (${opt.score})`;

                radio.addEventListener('change', () => {
                    hiddenScore.value = opt.score;
                    // Update button styles
                    btnGroup.querySelectorAll('.ys-btn').forEach(b => b.classList.remove('active'));
                    lbl.classList.add('active');
                    calculateTotalScores(config);
                });

                btnGroup.appendChild(radio);
                btnGroup.appendChild(lbl);
            });

            rowDiv.appendChild(qText);
            rowDiv.appendChild(btnGroup);
            rowDiv.appendChild(hiddenScore);
            fieldGroup.appendChild(rowDiv);
            fieldGroup.style.gridColumn = '1 / -1';
        } else if (f.type === 'scored-option-list') {
            label.style.marginBottom = '12px';

            const optGroup = document.createElement('div');
            optGroup.className = 'bt-option-group';

            const hiddenScore = document.createElement('input');
            hiddenScore.type = 'hidden';
            hiddenScore.id = f.id;
            hiddenScore.className = 'score-input';
            hiddenScore.value = '';

            f.options.forEach((opt, idx) => {
                const wrapper = document.createElement('label');
                wrapper.className = 'bt-option-card';

                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = f.id + '_opt';
                radio.value = opt.text;
                // radio.required = f.required; // Removed to avoid non-focusable required field error
                radio.style.display = 'none';

                radio.addEventListener('change', () => {
                    hiddenScore.value = opt.score;
                    optGroup.querySelectorAll('.bt-option-card').forEach(c => c.classList.remove('active'));
                    wrapper.classList.add('active');
                    calculateTotalScores(config);
                });

                wrapper.innerHTML = `
                    <div class="bt-option-text">${opt.text}</div>
                    <div class="bt-option-score">${opt.score} pts</div>
                `;
                wrapper.prepend(radio);
                optGroup.appendChild(wrapper);
            });

            fieldGroup.appendChild(optGroup);
            fieldGroup.appendChild(hiddenScore);
            fieldGroup.style.gridColumn = '1 / -1';
        } else if (f.type === 'barthel-result') {
            label.style.display = 'none';
            const box = document.createElement('div');
            box.className = 'ys-result-box';
            box.id = f.id;
            box.innerHTML = `
                <div class="ys-result-label">📊 Interpretación Índice de Barthel</div>
                <div class="ys-result-value" id="${f.id}_value">Complete la evaluación para ver resultado</div>
            `;
            fieldGroup.appendChild(box);
            fieldGroup.style.gridColumn = '1 / -1';
        } else if (f.type === 'info-text') {
            label.style.display = 'none';
            const p = document.createElement('p');
            p.className = 'info-text-field';
            p.textContent = f.text;
            fieldGroup.appendChild(p);
            fieldGroup.style.gridColumn = '1 / -1';
        } else if (f.type === 'hamilton-row') {
            label.style.display = 'none';
            const rowDiv = document.createElement('div');
            rowDiv.className = 'ha-row';

            const headerDiv = document.createElement('div');
            headerDiv.className = 'ha-header';
            headerDiv.innerHTML = `
                <div class="ha-label">${f.label}</div>
                <div class="ha-subtext">${f.subtext}</div>
            `;

            const scaleDiv = document.createElement('div');
            scaleDiv.className = 'ha-scale';

            const hiddenScore = document.createElement('input');
            hiddenScore.type = 'hidden';
            hiddenScore.id = f.id;
            hiddenScore.className = 'score-input';
            hiddenScore.value = '';

            [0, 1, 2, 3, 4].forEach(val => {
                const opt = document.createElement('label');
                opt.className = 'ha-opt';
                const labels = ['Ausente', 'Leve', 'Moderado', 'Grave', 'Muy grave'];

                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = f.id + '_val';
                radio.value = val;
                radio.addEventListener('change', () => {
                    hiddenScore.value = val;
                    scaleDiv.querySelectorAll('.ha-opt').forEach(o => o.classList.remove('active'));
                    opt.classList.add('active');
                    calculateTotalScores(config);
                });

                opt.innerHTML = `
                    <div class="ha-opt-val">${val}</div>
                    <div class="ha-opt-label">${labels[val]}</div>
                `;
                opt.prepend(radio);
                scaleDiv.appendChild(opt);
            });

            rowDiv.appendChild(headerDiv);
            rowDiv.appendChild(scaleDiv);
            rowDiv.appendChild(hiddenScore);
            fieldGroup.appendChild(rowDiv);
            fieldGroup.style.gridColumn = '1 / -1';
        } else if (f.type === 'mmse-row') {
            label.style.display = 'none';
            const rowDiv = document.createElement('div');
            rowDiv.className = 'mmse-row';

            const qText = document.createElement('div');
            qText.className = 'mmse-q-text';
            qText.textContent = f.label;

            const controls = document.createElement('div');
            controls.className = 'mmse-controls';

            const textInput = document.createElement('input');
            textInput.type = 'text';
            textInput.className = 'mmse-input';
            textInput.placeholder = 'Respuesta...';
            textInput.id = f.id + '_text';

            const scoreInput = document.createElement('input');
            scoreInput.type = 'hidden';
            scoreInput.id = f.id;
            scoreInput.className = 'score-input';
            scoreInput.value = '';

            const btnGroup = document.createElement('div');
            btnGroup.className = 'mmse-btn-group';

            [0, 1].forEach(val => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'mmse-btn';
                btn.textContent = val;
                btn.onclick = () => {
                    scoreInput.value = val;
                    btnGroup.querySelectorAll('.mmse-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    calculateTotalScores(config);
                };
                btnGroup.appendChild(btn);
            });

            controls.appendChild(textInput);
            controls.appendChild(btnGroup);
            rowDiv.appendChild(qText);
            rowDiv.appendChild(controls);
            rowDiv.appendChild(scoreInput);
            fieldGroup.appendChild(rowDiv);
            fieldGroup.style.gridColumn = '1 / -1';
        } else if (f.type === 'mmse-result') {
            label.style.display = 'none';
            const box = document.createElement('div');
            box.className = 'ys-result-box';
            box.id = f.id;
            box.innerHTML = `
                <div class="ys-result-label">🧠 Interpretación MMSE</div>
                <div class="ys-result-value" id="${f.id}_value">Complete la evaluación para ver resultado</div>
            `;
            fieldGroup.appendChild(box);
            fieldGroup.style.gridColumn = '1 / -1';
        } else if (f.type === 'info-block') {
            label.style.display = 'none';
            const block = document.createElement('div');
            block.className = 'clinical-info-block';
            block.textContent = f.text;
            fieldGroup.appendChild(block);
            fieldGroup.style.gridColumn = '1 / -1';
        } else if (f.type === 'hidden-score') {
            label.style.display = 'none';
            fieldGroup.style.display = 'none';
            const hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.id = f.id;
            hidden.className = 'score-input';
            fieldGroup.appendChild(hidden);
        } else if (f.type === 'depression-result') {
            label.style.display = 'none';
            const box = document.createElement('div');
            box.className = 'ys-result-box';
            box.id = f.id;
            box.innerHTML = `
                <div class="ys-result-label">🩺 Resultado de tamizaje depresivo</div>
                <div class="ys-result-value" id="${f.id}_value">Complete las preguntas para ver el resultado</div>
                <div class="ys-result-note">Instrumento de tamizaje — no constituye diagnóstico clínico</div>
            `;
            fieldGroup.appendChild(box);
            fieldGroup.style.gridColumn = '1 / -1';
        } else if (f.type === 'anxiety-result') {
            label.style.display = 'none';
            const box = document.createElement('div');
            box.className = 'ys-result-box';
            box.id = f.id;
            box.innerHTML = `
                <div class="ys-result-label">🧠 Resultado de tamizaje de ansiedad</div>
                <div class="ys-result-value" id="${f.id}_value">Complete las preguntas para ver el resultado</div>
                <div class="ys-result-note">Instrumento de tamizaje — no constituye diagnóstico clínico</div>
            `;
            fieldGroup.appendChild(box);
            fieldGroup.style.gridColumn = '1 / -1';
        }

        container.appendChild(fieldGroup);

        // Listeners adicionales para condicionales en selectores nativos
        if (f.type === 'select' || f.type === 'text' || f.type === 'number' || f.type === 'date' || f.type === 'textarea') {
            const el = document.getElementById(f.id);
            if (el) el.addEventListener('input', () => evaluateConditions(config));
        }
    }

    // Renderizar campos o secciones
    if (config.sections) {
        config.sections.forEach(sec => {
            const secDiv = document.createElement('div');
            secDiv.style.gridColumn = '1 / -1';
            secDiv.style.background = 'rgba(6, 182, 212, 0.05)';
            secDiv.style.padding = '15px 20px';
            secDiv.style.borderRadius = '12px';
            secDiv.style.marginBottom = '20px';
            secDiv.style.marginTop = '20px';
            secDiv.innerHTML = `<h4 style="color: var(--primary-600); margin: 0;">${sec.title}</h4>`;
            container.appendChild(secDiv);

            sec.fields.forEach(f => renderField(f, container));
        });
    } else if (config.fields) {
        config.fields.forEach(f => renderField(f, container));
    }

    // Evaluar estado condicional inicial
    evaluateConditions(config);
    calculateTotalScores(config);

    // Cargar borrador si existe
    const pDraft = patients.find(x => x.id === currentPatientId);
    if (pDraft) {
        let draftData = null;
        if (draftId) {
            const d = pDraft.docs.find(x => x.id === draftId);
            if (d) draftData = d.rawData;
        } else if (pDraft.drafts && pDraft.drafts[testId]) {
            draftData = pDraft.drafts[testId];
        }

        if (draftData) {
            console.log('Loading draft data for:', testId);
            loadDraftData(draftData, config);
        }
    }

    // --- AUTO-RELLENO DE DATOS DE IDENTIFICACIÓN (Solo para Test TO) ---
    if (testId === 'eval-to' && currentPatientId) {
        const p = patients.find(x => x.id === currentPatientId);
        if (p) {
            const nameField = document.getElementById('to_nombre');
            const ageField = document.getElementById('to_edad');
            const dobField = document.getElementById('to_fechaNac');

            // Solo rellenar si están vacíos (para no sobreescribir si ya se cargó un borrador con datos distintos)
            if (nameField && !nameField.value) nameField.value = p.nombre || '';
            if (dobField && !dobField.value) dobField.value = p.fechaNacimiento || '';

            if (ageField && !ageField.value) {
                const calculatedAge = calculateAge(p.fechaNacimiento);
                ageField.value = calculatedAge || p.edad || '';
            }
        }
    }

    document.getElementById('testModal').classList.add('active');
}

async function saveDraft() {
    if (!currentTestId || !currentPatientId) return;
    const config = testsConfig[currentTestId];
    const p = patients.find(x => x.id === currentPatientId);
    if (!p) return;

    const draftData = captureCurrentTestData(config);
    const today = new Date();
    const fecha = today.toLocaleDateString('es-CL');

    if (!p.docs) p.docs = [];

    const draftObj = {
        id: currentDraftId || ('doc-' + Date.now()),
        testId: currentTestId,
        titulo: config.title,
        estado: "borrador",
        editable: true,
        fechaGuardado: today.toLocaleString('es-CL'),
        fecha: fecha,
        rawData: draftData,
        profesional: currentProfesionalNombre || currentProfesional,
        isTest: true,
        contenido: "BORRADOR: Documento en proceso de edición."
    };

    if (currentDraftId) {
        const index = p.docs.findIndex(d => d.id === currentDraftId);
        if (index !== -1) {
            p.docs[index] = draftObj;
        } else {
            p.docs.unshift(draftObj);
        }
    } else {
        p.docs.unshift(draftObj);
        currentDraftId = draftObj.id;
    }

    savePatients();
    const syncedDoc = await syncDocumentoToSupabase(draftObj, p.id);
    if (syncedDoc) {
        const index = p.docs.findIndex(d => d.id === syncedDoc.id);
        if (index !== -1) p.docs[index] = syncedDoc;
        savePatients();
    }
    renderDocs();
    alert('✅ Borrador guardado exitosamente. Puedes seguir editando o cerrar el formulario.');
}

function loadDraftData(data, config) {
    const allFields = config.sections ?
        config.sections.reduce((acc, s) => acc.concat(s.fields), []) :
        config.fields;

    allFields.forEach(f => {
        const val = data[f.id];
        if (val === undefined || val === null) return;

        if (f.type === 'checkbox') {
            val.forEach(v => {
                const cb = document.querySelector(`input[name="${f.id}"][value="${v}"]`);
                if (cb) { cb.checked = true; cb.dispatchEvent(new Event('change')); }
            });
        } else if (f.type === 'radio' || f.type === 'sex-selector') {
            const rb = document.querySelector(`input[name="${f.id}"][value="${val}"]`);
            if (rb) { rb.checked = true; rb.dispatchEvent(new Event('change')); }
        } else if (f.type === 'scored-yesno') {
            const rb = document.querySelector(`input[name="${f.id}_yn"][value="${val}"]`);
            if (rb) {
                rb.checked = true;
                const lbl = document.querySelector(`label[for="${rb.id}"]`);
                if (lbl) lbl.click();
            }
        } else if (f.type === 'scored-option-list') {
            const rb = document.querySelector(`input[name="${f.id}_opt"][value="${val}"]`);
            if (rb) {
                const wrapper = rb.closest('.bt-option-card');
                if (wrapper) wrapper.click();
            }
        } else if (f.type === 'mmse-row') {
            const txt = document.getElementById(f.id + '_text');
            const score = document.getElementById(f.id);
            if (txt) txt.value = val.text;
            if (score && val.score !== '') {
                const btns = score.parentElement.querySelectorAll('.mmse-btn');
                btns.forEach(b => { if (b.textContent == val.score) b.click(); });
            }
        } else if (f.type === 'hamilton-row') {
            const score = document.getElementById(f.id);
            if (score && val !== '') {
                const scale = score.parentElement.querySelector('.ha-scale');
                if (scale) {
                    const radios = scale.querySelectorAll('input');
                    radios.forEach(r => {
                        if (r.value == val) {
                            r.checked = true;
                            r.dispatchEvent(new Event('change'));
                        }
                    });
                }
            }
        } else if (f.type === 'radio-grid') {
            Object.keys(val).forEach(row => {
                const rb = document.querySelector(`input[name="${f.id}_${row.replace(/\s+/g, '')}"][value="${val[row]}"]`);
                if (rb) rb.checked = true;
            });
        } else {
            const el = document.getElementById(f.id);
            if (el) {
                el.value = val;
                el.dispatchEvent(new Event('input'));
            }
        }
    });
    // Trigger totals after loading
    evaluateConditions(config);
    calculateTotalScores(config);
}

function calculateTotalScores(config) {
    const allFields = config.sections ? config.sections.flatMap(s => s.fields) : config.fields;
    const totalFields = allFields.filter(f => f.type === 'total-score' || f.type === 'dashboard-score');

    totalFields.forEach(tf => {
        let sum = 0;
        if (tf.sourceFields) {
            tf.sourceFields.forEach(id => {
                const el = document.getElementById(id);
                const group = document.getElementById('group_' + id);
                if (el && !el.disabled && (!group || group.style.display !== 'none')) {
                    const val = parseInt(el.value || 0, 10);
                    if (!isNaN(val)) sum += val;
                }
            });
        } else {
            const scoreInputs = document.querySelectorAll('.score-input');
            scoreInputs.forEach(input => {
                const group = document.getElementById('group_' + input.id);
                if (input.id.startsWith(tf.sourcePrefix) && !input.disabled && (!group || group.style.display !== 'none')) {
                    const val = parseInt(input.value || 0, 10);
                    if (!isNaN(val)) sum += val;
                }
            });
        }
        const totalEl = document.getElementById(tf.id);
        if (totalEl) totalEl.value = sum;
    });

    // Run specific updates safely
    try { if (typeof updateLawtonClassification === 'function') updateLawtonClassification(); } catch (e) { }
    try { if (typeof updateYesavageResult === 'function') updateYesavageResult(); } catch (e) { }
    try { if (typeof updateGAIResult === 'function') updateGAIResult(); } catch (e) { }
    try { if (typeof updateBarthelResult === 'function') updateBarthelResult(); } catch (e) { }
    try { if (typeof updateMMSEResult === 'function') updateMMSEResult(); } catch (e) { }
}

// --- LAWTON-BRODY: Guía de Interpretación Dinámica ---
function updateLawtonGuide(sexo) {
    const guideEl = document.getElementById('lb_guia');
    if (!guideEl) return;

    let rows = '';
    let funcLabel = '';

    if (sexo === 'mujer') {
        funcLabel = '8 funciones';
        rows = `
            <tr class="lb-row-total"><td>Dependencia total</td><td>0 – 1</td></tr>
            <tr class="lb-row-grave"><td>Dependencia grave</td><td>2 – 3</td></tr>
            <tr class="lb-row-moderada"><td>Dependencia moderada</td><td>4 – 5</td></tr>
            <tr class="lb-row-ligera"><td>Dependencia ligera</td><td>6 – 7</td></tr>
            <tr class="lb-row-autonomo"><td>Autónomo</td><td>8</td></tr>
        `;
    } else {
        funcLabel = '5 funciones';
        rows = `
            <tr class="lb-row-total"><td>Dependencia total</td><td>0</td></tr>
            <tr class="lb-row-grave"><td>Dependencia grave</td><td>1</td></tr>
            <tr class="lb-row-moderada"><td>Dependencia moderada</td><td>2 – 3</td></tr>
            <tr class="lb-row-ligera"><td>Dependencia ligera</td><td>4</td></tr>
            <tr class="lb-row-autonomo"><td>Autónomo</td><td>5</td></tr>
        `;
    }

    guideEl.innerHTML = `
        <div class="lb-guide-container">
            <div class="lb-guide-header">
                📊 Guía de Interpretación
                <span class="lb-guide-badge">${funcLabel}</span>
            </div>
            <table class="lb-guide-table">
                <thead>
                    <tr><th>Clasificación</th><th style="text-align:center;">Puntaje</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;

    // Also update classification with current score
    updateLawtonClassification();
}

function updateLawtonClassification() {
    const clasifEl = document.getElementById('lb_clasif_value');
    if (!clasifEl) return;

    const sexoRadio = document.querySelector('input[name="lb_sexo"]:checked');
    if (!sexoRadio) {
        clasifEl.textContent = 'Seleccione sexo para ver clasificación';
        return;
    }

    const totalEl = document.getElementById('lb_total');
    const score = totalEl ? parseInt(totalEl.value || 0, 10) : 0;
    const sexo = sexoRadio.value;
    let clasif = '';

    if (sexo === 'mujer') {
        if (score <= 1) clasif = 'Dependencia total';
        else if (score <= 3) clasif = 'Dependencia grave';
        else if (score <= 5) clasif = 'Dependencia moderada';
        else if (score <= 7) clasif = 'Dependencia ligera';
        else clasif = 'Autónomo';
    } else {
        if (score === 0) clasif = 'Dependencia total';
        else if (score === 1) clasif = 'Dependencia grave';
        else if (score <= 3) clasif = 'Dependencia moderada';
        else if (score === 4) clasif = 'Dependencia ligera';
        else clasif = 'Autónomo';
    }

    clasifEl.textContent = `${clasif}  (Puntaje: ${score})`;
}

// --- YESAVAGE: Resultado de tamizaje depresivo ---
function updateYesavageResult() {
    const resultEl = document.getElementById('ys_resultado_value');
    if (!resultEl) return;

    const totalEl = document.getElementById('ys_total');
    const score = totalEl ? parseInt(totalEl.value || 0, 10) : 0;

    // Check if any question answered
    const anyAnswered = document.querySelector('.score-input[id^="ys_"]');
    const hasValues = anyAnswered && document.querySelectorAll('.score-input[id^="ys_"]').length > 0;
    let allEmpty = true;
    document.querySelectorAll('.score-input[id^="ys_"]').forEach(inp => {
        if (inp.value !== '') allEmpty = false;
    });

    if (allEmpty) {
        resultEl.textContent = 'Complete las preguntas para ver el resultado';
        resultEl.className = 'ys-result-value';
        return;
    }

    let clasif = '';
    let colorClass = '';

    if (score <= 5) {
        clasif = 'Depresión improbable';
        colorClass = 'ys-result-ok';
    } else if (score <= 9) {
        clasif = 'Posible depresión';
        colorClass = 'ys-result-warning';
    } else {
        clasif = 'Probable presencia de depresión';
        colorClass = 'ys-result-alert';
    }

    resultEl.textContent = `${clasif}  (Puntaje: ${score}/15)`;
    resultEl.className = `ys-result-value ${colorClass}`;
}

// --- GAI: Resultado de tamizaje de ansiedad ---
function updateGAIResult() {
    const resultEl = document.getElementById('gai_resultado_value');
    const resultElRef = document.getElementById('rf_gai_value'); // Ref in summary

    const updateEl = (el) => {
        if (!el) return;
        const totalEl = document.getElementById('gai_total');
        const score = totalEl ? parseInt(totalEl.value || 0, 10) : 0;

        let allEmpty = true;
        document.querySelectorAll('.score-input[id^="gai_"]').forEach(inp => {
            if (inp.value !== '') allEmpty = false;
        });

        if (allEmpty) {
            el.textContent = 'Complete las preguntas para ver el resultado';
            el.className = 'ys-result-value';
            return;
        }

        let clasif = '';
        let colorClass = '';

        if (score <= 4) {
            clasif = 'Sin ansiedad';
            colorClass = 'ys-result-ok';
        } else if (score <= 7) {
            clasif = 'Ansiedad leve';
            colorClass = 'ys-result-warning';
        } else {
            clasif = 'Ansiedad severa';
            colorClass = 'ys-result-alert';
        }

        el.textContent = `${clasif}  (Puntaje: ${score}/10)`;
        el.className = `ys-result-value ${colorClass}`;
    };

    updateEl(resultEl);
    updateEl(resultElRef);
}

// --- BARTHEL: Resultado e interpretación ---
function updateBarthelResult() {
    const resultEl = document.getElementById('bt_resultado_value');
    if (!resultEl) return;

    const totalEl = document.getElementById('bt_total');
    const score = totalEl ? parseInt(totalEl.value || 0, 10) : 0;

    let allEmpty = true;
    document.querySelectorAll('.score-input[id^="bt_"]').forEach(inp => {
        if (inp.value !== '') allEmpty = false;
    });

    if (allEmpty) {
        resultEl.textContent = 'Complete la evaluación para ver resultado';
        resultEl.className = 'ys-result-value';
        return;
    }

    let clasif = '';
    let colorClass = '';

    if (score < 20) {
        clasif = 'Dependencia total';
        colorClass = 'ys-result-alert';
    } else if (score <= 35) {
        clasif = 'Dependencia grave';
        colorClass = 'ys-result-alert';
    } else if (score <= 55) {
        clasif = 'Dependencia moderada';
        colorClass = 'ys-result-warning';
    } else if (score < 100) {
        clasif = 'Dependencia leve';
        colorClass = 'ys-result-ok';
    } else {
        clasif = 'Independiente';
        colorClass = 'ys-result-ok';
    }

    resultEl.textContent = `${clasif} (Puntaje: ${score}/100)`;
    resultEl.className = `ys-result-value ${colorClass}`;
}

// --- MMSE: Resultado e interpretación ---
function updateMMSEResult() {
    const resultEl = document.getElementById('mm_resultado_value');
    if (!resultEl) return;

    const totalEl = document.getElementById('mm_total');
    const score = totalEl ? parseInt(totalEl.value || 0, 10) : 0;

    let allEmpty = true;
    document.querySelectorAll('.score-input[id^="mm_"]').forEach(inp => {
        if (inp.value !== '') allEmpty = false;
    });

    if (allEmpty) {
        resultEl.textContent = 'Complete la evaluación para ver resultado';
        resultEl.className = 'ys-result-value';
        return;
    }

    let clasif = '';
    let colorClass = '';

    if (score >= 27) {
        clasif = 'Normal';
        colorClass = 'ys-result-ok';
    } else if (score >= 24) {
        clasif = 'Sospecha leve';
        colorClass = 'ys-result-warning';
    } else if (score >= 12) {
        clasif = 'Deterioro cognitivo';
        colorClass = 'ys-result-alert';
    } else if (score >= 0) {
        clasif = 'Demencia';
        colorClass = 'ys-result-alert';
    }

    resultEl.textContent = `${clasif} (Puntaje: ${score}/30)`;
    resultEl.className = `ys-result-value ${colorClass}`;
}

// Evaluador de condiciones para mostrar/ocultar campos
function evaluateConditions(config) {
    const allFields = config.sections ?
        config.sections.reduce((acc, s) => acc.concat(s.fields), []) :
        config.fields;

    // 1. Update Hidden Scores first (like MMSE checklist count)
    const hiddenFields = allFields.filter(hf => hf.type === 'hidden-score');
    hiddenFields.forEach(hf => {
        if (hf.sourceCheckbox) {
            const checked = document.querySelectorAll(`input[name="${hf.sourceCheckbox}"]:checked`);
            const el = document.getElementById(hf.id);
            if (el) el.value = checked.length;
        }
    });

    // 2. Evaluate visibility conditions
    allFields.forEach(f => {
        if (f.condition) {
            const condField = allFields.find(x => x.id === f.condition.field);
            if (!condField) return;

            let isMet = false;
            if (condField.type === 'checkbox' || condField.type === 'radio') {
                const checked = Array.from(document.querySelectorAll(`input[name="${condField.id}"]:checked`)).map(e => e.value);
                isMet = checked.includes(f.condition.value);
            } else {
                const el = document.getElementById(condField.id);
                if (el) isMet = (el.value === f.condition.value);
            }

            const group = document.getElementById('group_' + f.id);
            if (group) group.style.display = isMet ? 'block' : 'none';
        }
    });
}

document.getElementById('dynamicTestForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const config = testsConfig[currentTestId];
    const p = patients.find(x => x.id === currentPatientId);

    let summary = "";

    const allFields = config.sections ?
        config.sections.reduce((acc, s) => acc.concat(s.fields), []) :
        config.fields;

    allFields.forEach(f => {
        // Ignorar campos ocultos por condición
        const group = document.getElementById('group_' + f.id);
        if (group && group.style.display === 'none') return;

        let value = "";
        if (f.type === 'checkbox') {
            const checked = Array.from(document.querySelectorAll(`input[name="${f.id}"]:checked`)).map(el => el.value);
            value = checked.length > 0 ? checked.join(', ') : 'No especificado';
        } else if (f.type === 'radio') {
            const checked = document.querySelector(`input[name="${f.id}"]:checked`);
            value = checked ? checked.value : 'No seleccionado';
        } else if (f.type === 'radio-grid') {
            value = "\n";
            f.rows.forEach(row => {
                const checked = document.querySelector(`input[name="${f.id}_${row.replace(/\s+/g, '')}"]:checked`);
                value += `    - ${row}: ${checked ? checked.value : 'Sin respuesta'}\n`;
            });
        } else if (f.type === 'scored-number') {
            const el = document.getElementById(f.id);
            value = el ? (el.value || '0') : '0';
            value = `Puntaje asignado: ${value}`;
        } else if (f.type === 'scored-yesno') {
            const checked = document.querySelector(`input[name="${f.id}_yn"]:checked`);
            const el = document.getElementById(f.id);
            const resp = checked ? checked.value : 'Sin respuesta';
            const score = el ? (el.value || '0') : '0';
            value = `${resp} (Puntaje: ${score})`;
        } else if (f.type === 'scored-radio') {
            const checked = document.querySelector(`input[name="${f.id}_radio"]:checked`);
            const optValue = checked ? checked.value : 'No seleccionado';
            const score = document.getElementById(f.id + '_score').value || 0;
            value = `${optValue} (Puntaje asignado: ${score})`;
        } else if (f.type === 'sex-selector') {
            const checked = document.querySelector(`input[name="${f.id}"]:checked`);
            value = checked ? (checked.value === 'mujer' ? 'Mujer' : 'Hombre') : 'No seleccionado';
        } else if (f.type === 'interpretation-guide' || f.type === 'suggested-classification') {
            return; // Skip guide/classification in summary
        } else if (f.type === 'depression-result' || f.type === 'anxiety-result' || f.type === 'barthel-result' || f.type === 'mmse-result') {
            const resEl = document.getElementById(f.id + '_value');
            value = resEl ? resEl.textContent : 'Sin resultado';
        } else if (f.type === 'total-score' || f.type === 'dashboard-score') {
            const el = document.getElementById(f.id);
            value = el ? el.value : '0';
        } else if (f.type === 'mmse-row') {
            const txtInput = document.getElementById(f.id + '_text');
            const txt = txtInput ? txtInput.value : '-';
            const scoreEl = document.getElementById(f.id);
            const score = scoreEl ? scoreEl.value : '0';
            value = `Resp: ${txt} | Pje: ${score}`;
        } else if (f.type === 'scored-option-list') {
            const checked = document.querySelector(`input[name="${f.id}_opt"]:checked`);
            const el = document.getElementById(f.id);
            const resp = checked ? checked.value : 'Sin respuesta';
            const score = el ? (el.value || '0') : '0';
            value = `${resp} (${score} pts)`;
        } else if (f.type === 'hamilton-row') {
            const el = document.getElementById(f.id);
            const score = el ? (el.value || '0') : '0';
            const labels = ['Ausente', 'Leve', 'Moderado', 'Grave', 'Muy grave'];
            value = `${labels[score] || 'Sin respuesta'} (Puntaje: ${score})`;
        } else if (f.type === 'info-text') {
            return;
        } else if (f.type === 'total-score') {
            const el = document.getElementById(f.id);
            value = el ? el.value : '0';
        } else {
            const el = document.getElementById(f.id);
            value = el ? (el.value || 'Sin respuesta') : 'Sin respuesta';
        }
        summary += `**${f.label}**\n${value}\n\n`;
    });

    const today = new Date();
    const fecha = today.toLocaleDateString('es-CL');

    if (!p.docs) p.docs = [];
    // Capturar datos en bruto para impresión (SOLUCIÓN OBLIGATORIA)
    const draftData = captureCurrentTestData(config);

    const docId = currentDraftId || ('doc-' + Date.now());
    const newDoc = {
        id: docId,
        testId: currentTestId,
        titulo: config.title,
        contenido: summary,
        rawData: draftData,
        fecha,
        profesional: currentProfesionalNombre || currentProfesional,
        isTest: true,
        estado: "finalizado",
        firma: null,
        firmaNombre: '',
        firmaRut: '',
        firmaRelacion: ''
    };

    if (currentDraftId) {
        const index = p.docs.findIndex(d => d.id === currentDraftId);
        if (index !== -1) p.docs[index] = newDoc;
        else p.docs.unshift(newDoc);
    } else {
        p.docs.unshift(newDoc);
    }


    // Limpiar borrador legacy si existiera
    if (p.drafts) delete p.drafts[currentTestId];

    currentDraftId = null;
    savePatients();
    const syncedDoc = await syncDocumentoToSupabase(newDoc, p.id);
    if (syncedDoc) {
        const index = p.docs.findIndex(d => d.id === syncedDoc.id);
        if (index !== -1) p.docs[index] = syncedDoc;
        savePatients();
    }
    renderDocs();
    renderTable();
    closeModal('testModal');
    alert('Evaluación guardada y enviada correctamente.');
});

function switchTab(e, tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');

    if (e && e.currentTarget) {
        e.currentTarget.classList.add('active');
    }
    document.getElementById('tab-' + tabId).style.display = 'block';
}

// Agregar Encuesta / Formulario (Desactivado si no existe el form)
const docFormEl = document.getElementById('docForm');
if (docFormEl) {
    docFormEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        const p = patients.find(x => x.id === currentPatientId);
        if (!p) return;

        if (!p.docs) p.docs = [];

        const dTitulo = document.getElementById('dTipoEncuesta').value;
        const dContenido = document.getElementById('dContenido').value;

        const today = new Date();
        const fecha = today.toLocaleDateString('es-CL'); // Formato local

        const newDoc = {
            id: 'doc-' + Date.now(),
            titulo: dTitulo,
            contenido: dContenido,
            fecha,
            profesional: currentProfesionalNombre || currentProfesional,
            isTest: false,
            estado: 'finalizado',
            rawData: {}
        };

        p.docs.unshift(newDoc);
        p.ultimaVisita = fecha; // Actualizamos la última visita

        savePatients();
        const syncedDoc = await syncDocumentoToSupabase(newDoc, p.id);
        if (syncedDoc) {
            const index = p.docs.findIndex(d => d.id === syncedDoc.id);
            if (index !== -1) p.docs[index] = syncedDoc;
            savePatients();
        }
        renderDocs();
        renderTable(); // Para reflejar la fecha actualizada
        docFormEl.reset();
    });
}

// Renderizar Documentos en la Ficha
function renderDocs() {
    const list = document.getElementById('docList');
    if (!list) return;
    list.innerHTML = '';
    const p = patients.find(x => x.id === currentPatientId);

    if (!p || !p.docs || p.docs.length === 0) {
        list.innerHTML = '<p style="color: var(--text-tertiary); text-align:center; padding: 20px;">No hay encuestas ni formularios registrados para este paciente.</p>';
        return;
    }

    p.docs.forEach(d => {
        const div = document.createElement('div');
        div.className = 'doc-item';
        const profBadge = d.profesional === 'psicologo' ? '🧠 Psicología' : (d.profesional === 'terapeuta' ? '👐 Terapia Ocupacional' : 'General');

        const isDraft = d.estado === 'borrador';
        const statusBadge = isDraft ? '<span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; border: 1px solid #fde68a; margin-left: 10px;">💾 BORRADOR</span>' : '';

        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <div style="display: flex; align-items: center;">
                    <span class="doc-date" style="margin: 0;">📅 ${d.fecha}</span>
                    ${statusBadge}
                </div>
                <span class="feature-tag">${profBadge}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 15px;">
                <div style="flex: 1;">
                    <h4 style="margin: 0;">${d.titulo}</h4>
                    <p style="white-space: pre-line; margin-top:8px; font-size: 0.9rem; color: var(--text-secondary);">${d.contenido.substring(0, 150)}${d.contenido.length > 150 ? '...' : ''}</p>
                </div>
                <div style="display: flex; flex-direction: column; gap: 6px; min-width: 130px;">
                   ${d.isTest && !isDraft ? `<button class="btn-outline" style="padding: 6px 12px; font-size: 0.75rem; white-space: nowrap; width: 100%;" onclick="printTestDoc('${d.id}')">🖨️ Imprimir Informe</button>` : ''}
                    ${d.testId ? `<button class="btn-outline" style="padding: 6px 12px; font-size: 0.75rem; white-space: nowrap; width: 100%;" onclick="openTestForm('${d.testId}', '${d.id}')">✏️ Editar</button>` : ''}
                    ${isDraft ? `<button class="btn-outline" style="padding: 6px 12px; font-size: 0.75rem; white-space: nowrap; border-color: #ef4444; color: #ef4444; width: 100%;" onclick="deleteDraft('${d.id}')">🗑️ Eliminar</button>` : ''}
                </div>
            </div>
        `;
        list.appendChild(div);
    });
}

async function deleteDraft(docId) {
    if (!confirm('¿Estás seguro de eliminar este borrador? Se perderán los datos no guardados permanentemente.')) return;
    const p = patients.find(x => x.id === currentPatientId);
    if (p && p.docs) {
        const deletedRemote = await deleteDocumentoFromSupabase(docId);
        if (!deletedRemote) return;
        p.docs = p.docs.filter(d => d.id !== docId);
        savePatients();
        renderDocs();
    }
}

// Navegación
function openDashboard() {
    if (!isAuthenticated) {
        document.getElementById('loginModal').classList.add('active');
    } else {
        const systemSection = document.getElementById('sistema');
        systemSection.style.display = 'block';
        systemSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// --- ACTA DE VISITAS: REGISTRO DE SESIONES ---
let isDrawing = false;
let signatureCanvas, sigCtx;
let isProfessionalDrawing = false;
let professionalSignatureCanvas, profSigCtx;

function openSessionForm() {
    const form = document.getElementById('sessionForm');
    const submitBtn = form.querySelector('button[type="submit"]');

        submitBtn.disabled = false;
        submitBtn.textContent = 'Registrar Visita';
        submitBtn.style.pointerEvents = 'auto';
        submitBtn.style.opacity = '1';
    currentEditingVisitaId = null;
    try {
        const p = patients.find(x => x.id === currentPatientId);
        if (!p) {
            alert("Error: No se ha seleccionado un paciente válido.");
            return;
        }

        const form = document.getElementById('sessionForm');
        if (!form) return;
        form.reset();
        clearSignature();
        applyCurrentUserProfessionalProfile();

        // Set current date and professional type
        const today = new Date().toISOString().split('T')[0];
        const fechaEl = document.getElementById('sFecha');
        const tipoEl = document.getElementById('sTipo');
        const profNombreEl = document.getElementById('sProfesionalNombre');
        const firmaRutEl = document.getElementById('sFirmaRut');
        const profFirmaLabel = document.getElementById('sProfFirmaNombreLabel');

        if (fechaEl) fechaEl.value = today;
        if (tipoEl) tipoEl.value = currentProfesional === 'psicologo' ? 'Psicología' : 'Terapia Ocupacional';
        if (profNombreEl) profNombreEl.value = currentProfesionalNombre || '';
        if (firmaRutEl) firmaRutEl.value = '';
        if (tipoEl) tipoEl.disabled = !isCurrentUserAdmin();
        if (profNombreEl) profNombreEl.disabled = !isCurrentUserAdmin();
        if (profFirmaLabel) profFirmaLabel.textContent = currentProfesionalNombre || 'Profesional';

        // Reset Signature source
        const defaultRadio = document.querySelector('input[name="sFirmaTipo"][value="manual"]');
        if (defaultRadio) {
            defaultRadio.checked = true;
            toggleSignatureSource('manual');
        }
        fileSignatureBase64 = null;
        cameraSignatureBase64 = null;
        document.getElementById('firmaArchivoPreview').style.display = 'none';
        document.getElementById('sFirmaArchivo').value = '';

        // Default times (current time)
        const now = new Date();
        const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        const horaIEl = document.getElementById('sHoraI');
        if (horaIEl) horaIEl.value = timeStr;

        const modal = document.getElementById('sessionModal');
        if (modal) modal.classList.add('active');

        // Initialize signature pads after modal is shown to get correct dimensions
        setTimeout(() => {
            initSignaturePad();
            initProfessionalSignaturePad();
        }, 300);
    } catch (e) {
        console.error("Error detallado al abrir formulario de sesión:", e);
        alert(`Error al abrir formulario: ${e.message}`);
    }
}

function initSignaturePad() {
    signatureCanvas = document.getElementById('signatureCanvas');
    if (!signatureCanvas) return;
    sigCtx = signatureCanvas.getContext('2d');

    // Ajustar el tamaño real del canvas al tamaño visual
    const rect = signatureCanvas.getBoundingClientRect();
    signatureCanvas.width = rect.width;
    signatureCanvas.height = rect.height;

    const getPos = (e) => {
        const rect = signatureCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e) => {
        isDrawing = true;
        const pos = getPos(e);
        sigCtx.beginPath();
        sigCtx.moveTo(pos.x, pos.y);
        if (e.touches) e.preventDefault();
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const pos = getPos(e);
        sigCtx.lineTo(pos.x, pos.y);
        sigCtx.stroke();
        if (e.touches) e.preventDefault();
    };

    const stopDrawing = () => {
        isDrawing = false;
    };

    signatureCanvas.addEventListener('mousedown', startDrawing);
    signatureCanvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDrawing);

    signatureCanvas.addEventListener('touchstart', startDrawing, { passive: false });
    signatureCanvas.addEventListener('touchmove', draw, { passive: false });
    signatureCanvas.addEventListener('touchend', stopDrawing);

    // Style
    sigCtx.lineWidth = 2.5;
    sigCtx.lineCap = 'round';
    sigCtx.lineJoin = 'round';
    sigCtx.strokeStyle = '#1e293b'; // Slate 800
}

// --- NUEVA LÓGICA MULTI-FUENTE DE FIRMA ---
function initProfessionalSignaturePad() {
    professionalSignatureCanvas = document.getElementById('professionalSignatureCanvas');
    if (!professionalSignatureCanvas) return;
    profSigCtx = professionalSignatureCanvas.getContext('2d');

    const rect = professionalSignatureCanvas.getBoundingClientRect();
    professionalSignatureCanvas.width = rect.width;
    professionalSignatureCanvas.height = rect.height;

    const getPos = (e) => {
        const r = professionalSignatureCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - r.left, y: clientY - r.top };
    };

    const startDrawing = (e) => {
        isProfessionalDrawing = true;
        const pos = getPos(e);
        profSigCtx.beginPath();
        profSigCtx.moveTo(pos.x, pos.y);
        if (e.touches) e.preventDefault();
    };

    const draw = (e) => {
        if (!isProfessionalDrawing) return;
        const pos = getPos(e);
        profSigCtx.lineTo(pos.x, pos.y);
        profSigCtx.stroke();
        if (e.touches) e.preventDefault();
    };

    const stopDrawing = () => {
        isProfessionalDrawing = false;
    };

    professionalSignatureCanvas.onmousedown = startDrawing;
    professionalSignatureCanvas.onmousemove = draw;
    professionalSignatureCanvas.onmouseup = stopDrawing;
    professionalSignatureCanvas.onmouseleave = stopDrawing;
    professionalSignatureCanvas.ontouchstart = startDrawing;
    professionalSignatureCanvas.ontouchmove = draw;
    professionalSignatureCanvas.ontouchend = stopDrawing;

    profSigCtx.lineWidth = 2.5;
    profSigCtx.lineCap = 'round';
    profSigCtx.lineJoin = 'round';
    profSigCtx.strokeStyle = '#1e293b';
}

function clearProfessionalSignature() {
    if (professionalSignatureCanvas && profSigCtx) {
        profSigCtx.clearRect(0, 0, professionalSignatureCanvas.width, professionalSignatureCanvas.height);
    }
}

let currentSignatureType = 'manual';
let cameraStream = null;
let fileSignatureBase64 = null;
let cameraSignatureBase64 = null;

function toggleSignatureSource(type) {
    currentSignatureType = type;
    document.querySelectorAll('.sig-source-container').forEach(el => el.style.display = 'none');

    if (type === 'manual') {
        document.getElementById('sigSourceManual').style.display = 'block';
        stopCamera();
    } else if (type === 'archivo') {
        document.getElementById('sigSourceArchivo').style.display = 'block';
        stopCamera();
    } else if (type === 'camara') {
        document.getElementById('sigSourceCamara').style.display = 'block';
        startCamera();
    }
}

function handleSignatureFile(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            fileSignatureBase64 = e.target.result;
            document.getElementById('firmaArchivoPreview').style.display = 'block';
            document.getElementById('imgFirmaPrev').src = fileSignatureBase64;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

async function startCamera() {
    const video = document.getElementById('signatureVideo');
    if (!video) return;

    document.getElementById('cameraControls').style.display = 'block';
    document.getElementById('cameraPreview').style.display = 'none';

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
        });
        video.srcObject = cameraStream;
    } catch (err) {
        console.error("Error al acceder a la cámara:", err);
        alert("No se pudo acceder a la cámara. Verifique los permisos.");
    }
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
}

function captureFromCamera() {
    const video = document.getElementById('signatureVideo');
    const canvas = document.getElementById('cameraResultCanvas');
    if (!video || !canvas) return;

    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    cameraSignatureBase64 = canvas.toDataURL('image/png');

    document.getElementById('cameraControls').style.display = 'none';
    document.getElementById('cameraPreview').style.display = 'block';
    stopCamera();
}

function resetCamera() {
    cameraSignatureBase64 = null;
    startCamera();
}

function clearSignature() {
    if (signatureCanvas && sigCtx) {
        sigCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
    }
}

function isSignatureBlank() {
    if (!signatureCanvas) return true;
    const blank = document.createElement('canvas');
    blank.width = signatureCanvas.width;
    blank.height = signatureCanvas.height;
    return signatureCanvas.toDataURL() === blank.toDataURL();
}

function captureSignatureToBase64(canvas) {
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let hasContent = false;

    // Validar que el canvas no esté vacío (revisando canal Alpha)
    for (let i = 0; i < pixelData.length; i += 4) {
        if (pixelData[i + 3] > 0) {
            hasContent = true;
            break;
        }
    }

    if (!hasContent) return null;

    // Retornar base64 PNG
    return canvas.toDataURL('image/png');
}

document.getElementById('sessionForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = document.getElementById('sessionForm');
    const submitBtn = form.querySelector('button[type="submit"]');

    if (submitBtn.disabled) return;

    // 🔒 Bloquear botón
    submitBtn.disabled = true;
    submitBtn.dataset.originalText = submitBtn.textContent;
    submitBtn.textContent = 'Guardando...';
    submitBtn.style.pointerEvents = 'none';
    submitBtn.style.opacity = '0.7';

    try {
        const p = patients.find(x => x.id === currentPatientId);
        if (!p) throw new Error('No se encontró el paciente.');

        let finalFirmaBase64 = null;
        const finalFirmaProfesionalBase64 = captureSignatureToBase64(professionalSignatureCanvas);

        if (currentSignatureType === 'manual') {
            finalFirmaBase64 = captureSignatureToBase64(signatureCanvas);
        } else if (currentSignatureType === 'archivo') {
            finalFirmaBase64 = fileSignatureBase64;
        } else if (currentSignatureType === 'camara') {
            finalFirmaBase64 = cameraSignatureBase64;
        }

        if (!finalFirmaBase64) {
            throw new Error(
                currentSignatureType === 'manual'
                    ? 'La firma manual es obligatoria.'
                    : currentSignatureType === 'archivo'
                        ? 'Debe seleccionar una imagen.'
                        : 'Debe capturar una foto.'
            );
        }

        if (!finalFirmaProfesionalBase64) {
            throw new Error('La firma del profesional es obligatoria.');
        }

        if (!p.visitas) p.visitas = [];

        const visitaExistente = p.visitas.find(v => v.id === currentEditingVisitaId);

            const nextNum = visitaExistente
                    ? visitaExistente.num
                    : (p.visitas.length > 0
                    ? Math.max(...p.visitas.map(v => Number(v.num) || 0)) + 1
                    : 1);

            const newVisita = {
                    id: currentEditingVisitaId || null,
                    num: nextNum,
                    fecha: document.getElementById('sFecha').value,
                    tipo: document.getElementById('sTipo').value,
                    horaI: document.getElementById('sHoraI').value,
                    horaT: document.getElementById('sHoraT').value,
                    objetivo: document.getElementById('sObjetivo').value,
                    actividades: document.getElementById('sActividades').value,
                    obs: document.getElementById('sObs').value,
                   firma: finalFirmaBase64,
                    firmaProf: finalFirmaProfesionalBase64,
                    firmaNombre: document.getElementById('sFirmaNombre').value,
                    firmaRut: document.getElementById('sFirmaRut').value,
                    relacion: document.getElementById('sRelacion').value,
                    profesionalNombre: document.getElementById('sProfesionalNombre').value,
                    profesional: currentProfesional
                };
        const visitaGuardada = await syncVisitaToSupabase(newVisita, p.id);
        if (!visitaGuardada) throw new Error('No se pudo guardar la visita.');

        const visitaFinal = {
            id: visitaGuardada.id,
            num: visitaGuardada.num,
            fecha: visitaGuardada.fecha,
            tipo: visitaGuardada.tipo,
            horaI: visitaGuardada.hora_inicio,
            horaT: visitaGuardada.hora_termino,
            objetivo: visitaGuardada.objetivo,
            actividades: visitaGuardada.actividades,
            obs: visitaGuardada.observaciones,
            firma: visitaGuardada.firma,
            firmaProf: visitaGuardada.firma_profesional_base64 || newVisita.firmaProf,
            firmaNombre: visitaGuardada.firma_nombre,
            firmaRut: visitaGuardada.firma_rut,
            relacion: visitaGuardada.relacion,
            profesionalNombre: visitaGuardada.profesional_nombre,
            profesional: visitaGuardada.profesional_area
        };

        if (currentEditingVisitaId) {
        const idx = p.visitas.findIndex(v => v.id === currentEditingVisitaId);
        if (idx !== -1) {
        p.visitas[idx] = visitaFinal;
            }
            } else {
        p.visitas.push(visitaFinal);
            }

       const okUltima = await actualizarUltimaVisitaPaciente(p);
        if (!okUltima) throw new Error('Error actualizando última visita.');

        savePatients();
        renderVisitas();
        renderTable();


        // 🔥 ACTUALIZA AL INSTANTE LA TABLA
        renderVisitas();
        renderTable();

        // 🧹 limpiar y cerrar
        form.reset();
        clearSignature();
        clearProfessionalSignature();
        stopCamera();
        closeModal('sessionModal');

        currentEditingVisitaId = null;
        submitBtn.textContent = submitBtn.dataset.originalText || 'Registrar Visita';

        alert('✅ Visita domiciliaria registrada correctamente.');

        submitBtn.disabled = false;
        submitBtn.textContent = currentEditingVisitaId ? 'Guardar cambios' : 'Registrar Visita';
        submitBtn.style.pointerEvents = 'auto';
        submitBtn.style.opacity = '1';

    } catch (error) {
        console.error('Error:', error);
        alert('❌ ' + error.message);

        // 🔓 reactivar botón solo si falla
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.dataset.originalText || 'Registrar Visita';
        submitBtn.style.pointerEvents = 'auto';
        submitBtn.style.opacity = '1';
    }
});

function renderVisitas() {
    const list = document.getElementById('sessionsList');
    if (!list) return;
    const p = patients.find(x => x.id === currentPatientId);

    if (!p || !p.visitas || p.visitas.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-tertiary); background: rgba(0,0,0,0.02); border-radius: 20px; border: 1px dashed #ddd;">
                <span style="font-size: 2rem; display: block; margin-bottom: 10px;">📋</span>
                No hay visitas registradas para este paciente.
            </div>
        `;
        return;
    }

    // Ordenar por número de sesión descendente (más reciente arriba)
    const sorted = [...(p.visitas || [])].sort((a, b) => b.num - a.num);

    list.innerHTML = sorted.map(s => `
        <div class="session-card">
            <div class="session-header">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="session-num">VISITA ${s.num}</span>
                    <span class="session-type-badge ${s.tipo === 'Psicología' ? 'type-psicologia' : 'type-terapeuta'}">
                        ${s.tipo === 'Psicología' ? '🧠 Psicología' : '👐 Terapia Ocupacional'}
                    </span>
                </div>
                <div class="session-meta">
                    <span title="Fecha de visita">📅 ${s.fecha.split('-').reverse().join('/')}</span>
                    <span title="Horario">⏰ ${s.horaI} - ${s.horaT}</span>
                    <button class="action-btn" onclick="printSingleVisita(${s.num})" style="margin-left: 10px; font-size: 0.8rem; background: var(--primary-100); color: var(--primary-700); border: 1px solid var(--primary-200);" title="Imprimir esta visita">🖨️ Imprimir Registro</button>
                    <button class="action-btn" onclick="openEditVisita('${s.id}')" style="margin-left: 5px; font-size: 0.8rem;" title="Editar visita">✏️ Editar</button>
                    <button class="action-btn delete" onclick="deleteVisita(${s.num})" style="margin-left: 5px; font-size: 0.8rem;" title="Eliminar registro">🗑️</button>
                </div>
            </div>
            
            <div class="session-body">
                <div class="session-section">
                    <span class="session-label">Objetivo de la Visita</span>
                    <p class="session-text">${s.objetivo}</p>
                </div>
                <div class="session-section">
                    <span class="session-label">Actividades Realizadas</span>
                    <p class="session-text">${s.actividades}</p>
                </div>
                ${s.obs ? `
                <div class="session-section">
                    <span class="session-label">Observaciones y Sugerencias</span>
                    <p class="session-text">${s.obs}</p>
                </div>` : ''}
            </div>
            
            <div class="session-footer">
                <div style="color: var(--text-tertiary); font-size: 0.8rem; line-height: 1.4;">
                    <strong>Profesional:</strong> ${s.profesionalNombre || (s.profesional === 'psicologo' ? 'Psicólogo' : 'Terapeuta Ocupacional')}<br>
                    <span style="font-style: italic;">Especialidad: ${s.tipo}</span>
                </div>
                <div class="signature-box">
                    <img src="${s.firma}" class="signature-display" alt="Firma">
                    <div class="signature-name">${s.firmaNombre}</div>
                    <div class="signature-rel">${s.relacion} | RUT: ${s.firmaRut || 'N/A'}</div>
                </div>
                <div class="signature-box">
                    ${s.firmaProf ? `<img src="${s.firmaProf}" class="signature-display" alt="Firma profesional">` : '<div style="font-size: 0.75rem; color: #ef4444;">Sin firma profesional</div>'}
                    <div class="signature-name">${s.profesionalNombre || 'Profesional'}</div>
                    <div class="signature-rel">Firma profesional</div>
                </div>
            </div>
        </div>
    `).join('');

    // --- RENDERIZAR TABLA DE IMPRESIÓN OFICIAL ---
    const printTbody = document.getElementById('printTableBody');
    if (printTbody) {
        if (!p.visitas || p.visitas.length === 0) {
            printTbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">No hay visitas registradas para imprimir.</td></tr>';
        } else {
            const chronological = [...p.visitas].sort((a, b) => a.num - b.num);
            printTbody.innerHTML = chronological.map(s => {
                const firmaImg = (s.firma && s.firma.length > 100)
                    ? `<img src="${s.firma}" style="max-width: 120px; max-height: 60px; filter: contrast(150%) grayscale(100%);">`
                    : '<span style="color: #999; font-style: italic;">Sin firma</span>';
                const firmaProfImg = (s.firmaProf && s.firmaProf.length > 100)
                    ? `<img src="${s.firmaProf}" style="max-width: 120px; max-height: 60px; filter: contrast(150%) grayscale(100%);">`
                    : '<span style="color: #999; font-style: italic;">Sin firma</span>';

                return `
                    <tr>
                        <td style="text-align: center;">${s.num}</td>
                        <td>${s.fecha.split('-').reverse().join('/')}</td>
                        <td>${s.horaI} - ${s.horaT}</td>
                        <td>${s.tipo}</td>
                        <td>${s.profesionalNombre || 'No especificado'}</td>
                        <td>
                            <strong>${s.firmaNombre || 'Sin nombre'}</strong><br>
                            <span style="font-size: 0.75rem;">${s.relacion || '-'}</span><br>
                            <span style="font-size: 0.75rem;">RUT: ${s.firmaRut || 'N/A'}</span>
                        </td>
                        <td style="text-align: center;">
                            ${firmaImg}
                        </td>
                        <td style="text-align: center;">
                            ${firmaProfImg}
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }
}

async function openEditVisita(visitaId) {
    const p = patients.find(x => x.id === currentPatientId);
    if (!p || !p.visitas) return;

    const visita = p.visitas.find(v => v.id === visitaId);
    if (!visita) return;

    const visitaDb = await loadFullVisitaById(visitaId);
    if (!visitaDb) {
        alert('No se pudo cargar la visita completa.');
        return;
    }

    currentEditingVisitaId = visita.id;

    const form = document.getElementById('sessionForm');
    if (!form) return;
    form.reset();

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar cambios';
        submitBtn.style.pointerEvents = 'auto';
        submitBtn.style.opacity = '1';
    }

    document.getElementById('sFecha').value = visita.fecha || '';
    document.getElementById('sTipo').value = visita.tipo || '';
    document.getElementById('sHoraI').value = visita.horaI || '';
    document.getElementById('sHoraT').value = visita.horaT || '';
    document.getElementById('sObjetivo').value = visita.objetivo || '';
    document.getElementById('sActividades').value = visita.actividades || '';
    document.getElementById('sObs').value = visita.obs || '';
    document.getElementById('sFirmaNombre').value = visita.firmaNombre || '';
    document.getElementById('sFirmaRut').value = visita.firmaRut || '';
    document.getElementById('sRelacion').value = visita.relacion || '';
    document.getElementById('sProfesionalNombre').value = visita.profesionalNombre || '';

    const firmaPaciente = visitaDb?.firma || visita?.firma || '';
    const firmaProfesional = visitaDb?.firma_profesional_base64 || visita?.firmaProf || '';

    document.getElementById('sessionModal').classList.add('active');

    setTimeout(() => {
        initSignaturePad();
        initProfessionalSignaturePad();

if (firmaPaciente && signatureCanvas && sigCtx) {
    const img = new Image();
    img.onload = () => {
        sigCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
        sigCtx.drawImage(img, 0, 0, signatureCanvas.width, signatureCanvas.height);
    };
    if (firmaPaciente) {
    img.src = firmaPaciente;
} else {
    img.removeAttribute('src');
}
    }

    if (firmaProfesional && professionalSignatureCanvas && profSigCtx) {
        const img2 = new Image();
        img2.onload = () => {
            profSigCtx.clearRect(0, 0, professionalSignatureCanvas.width, professionalSignatureCanvas.height);
            profSigCtx.drawImage(img2, 0, 0, professionalSignatureCanvas.width, professionalSignatureCanvas.height);
        };
        img2.src = firmaProfesional;
    }
        if (submitBtn) submitBtn.textContent = 'Guardar cambios';
    }, 300);
}
async function printSingleVisita(num) {
    const p = patients.find(x => x.id === currentPatientId);
    if (!p || !p.visitas) return;

    const visita = p.visitas.find(v => v.num === num);
    if (!visita) return;

    const visitaDb = await loadFullVisitaById(visita.id);
    if (!visitaDb) {
        alert('No se pudo cargar la visita completa para imprimir.');
        return;
    }

    const s = {
        ...visita,
        firma: visitaDb.firma || '',
        firmaProf: visitaDb.firma_profesional_base64 || visita.firmaProf || ''
    };

    // 1. Activar contenedor individual
    setActivePrintContainer('printVisitaIndividualContainer');

    // 2. Llenar datos del paciente
    document.getElementById('privNombre').textContent = p.nombre || '---';
    document.getElementById('privRut').textContent = p.rut || '---';
    document.getElementById('privDir').textContent = p.domicilio || '---';

    // 3. Llenar datos de la visita
    document.getElementById('privNum').textContent = s.num;
    document.getElementById('privFechaHora').textContent = `${s.fecha.split('-').reverse().join('/')} | ${s.horaI} - ${s.horaT}`;
    document.getElementById('privTipo').textContent = s.tipo;
    document.getElementById('privProf').textContent = s.profesionalNombre || (s.profesional === 'psicologo' ? 'Psicólogo' : 'Terapeuta Ocupacional');

    // 4. Llenar contenido clínico
    document.getElementById('privObjetivo').textContent = s.objetivo;
    document.getElementById('privActividades').textContent = s.actividades;

    const obsContainer = document.getElementById('privObsContainer');
    if (s.obs) {
        obsContainer.style.display = 'block';
        document.getElementById('privObs').textContent = s.obs;
    } else {
        obsContainer.style.display = 'none';
    }

    // 5. Llenar firma paciente
    const firmaImg = document.getElementById('privFirmaImg');
    if (firmaImg) {
        if (s.firma && s.firma.length > 100) {
            firmaImg.src = s.firma;
            firmaImg.style.display = 'block';
        } else {
            firmaImg.style.display = 'none';
        }
    }

    document.getElementById('privFirmanteNombre').textContent = s.firmaNombre || '---';
    document.getElementById('privFirmanteRel').textContent = `${s.relacion || '---'} ${s.firmaRut ? '| RUT: ' + s.firmaRut : ''}`;

    // 6. Llenar firma profesional
    const firmaProfImg = document.getElementById('privFirmaProfImg');
    if (firmaProfImg) {
        if (s.firmaProf && s.firmaProf.length > 100) {
            firmaProfImg.src = s.firmaProf;
            firmaProfImg.style.display = 'block';
        } else {
            firmaProfImg.style.display = 'none';
        }
    }

    const firmaProfNombre = document.getElementById('privFirmaProfNombre');
    if (firmaProfNombre) {
        firmaProfNombre.textContent = s.profesionalNombre || 'Firma Profesional';
    }

    setTimeout(() => {
        window.print();
    }, 250);
}

function setActivePrintContainer(id) {
    document.querySelectorAll('.print-only').forEach(el => el.classList.remove('active-print'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active-print');
}

function prepareAndPrint() {
    const p = patients.find(x => x.id === currentPatientId);
    if (!p) {
        alert("Error: No hay un paciente seleccionado.");
        return;
    }

    // ACTIVAR SOLO ESTE CONTENEDOR PARA IMPRESIÓN
    setActivePrintContainer('printContainer');

    // Forzar actualización de datos en el contenedor de impresión
    document.getElementById('prNombre').textContent = p.nombre || 'N/A';
    document.getElementById('prRut').textContent = p.rut || 'N/A';
    document.getElementById('prDireccion').textContent = p.domicilio || 'N/A';
    document.getElementById('prTelefono').textContent = p.telefono || 'N/A';

    const visitas = p.visitas || [];
    const printTbody = document.getElementById('printTableBody');
    if (printTbody) {
        if (visitas.length === 0) {
            printTbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 30px; font-weight: bold;">SIN VISITAS REGISTRADAS</td></tr>';
        } else {
            const sorted = [...visitas].sort((a, b) => a.num - b.num);
            printTbody.innerHTML = sorted.map(s => {
                const firmaImg = (s.firma && s.firma.length > 100)
                    ? `<img src="${s.firma}" style="max-width: 140px; max-height: 70px; filter: contrast(150%) grayscale(100%); display: block; margin: 0 auto;">`
                    : '<span style="color: #666; font-style: italic;">Sin firma</span>';
                const firmaProfImg = (s.firmaProf && s.firmaProf.length > 100)
                    ? `<img src="${s.firmaProf}" style="max-width: 140px; max-height: 70px; filter: contrast(150%) grayscale(100%); display: block; margin: 0 auto;">`
                    : '<span style="color: #666; font-style: italic;">Sin firma</span>';

                return `
                    <tr>
                        <td style="text-align: center; font-weight: bold;">${s.num}</td>
                        <td style="white-space: nowrap;">${s.fecha.split('-').reverse().join('/')}</td>
                        <td style="white-space: nowrap;">${s.horaI} - ${s.horaT}</td>
                        <td>${s.tipo}</td>
                        <td>${s.profesionalNombre || 'No registrado'}</td>
                        <td>
                            <strong>${s.firmaNombre || 'N/A'}</strong><br>
                            <small>${s.relacion || '-'}</small><br>
                            <small>RUT: ${s.firmaRut || 'N/A'}</small>
                        </td>
                        <td style="text-align: center; background: #fff !important;">
                            ${firmaImg}
                        </td>
                        <td style="text-align: center; background: #fff !important;">
                            ${firmaProfImg}
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    // Pequeña espera para que el navegador procese los cambios en el DOM antes de imprimir
    setTimeout(() => {
        window.print();
    }, 250);
}

async function deleteVisita(num) {
    if (!confirm(`¿Está seguro de que desea eliminar el registro de la Visita ${num}? Esta acción no se puede deshacer.`)) {
        return;
    }

    const p = patients.find(x => x.id === currentPatientId);
    if (!p) return;

    const visitaAEliminar = p.visitas.find(v => v.num === num);
    if (!visitaAEliminar) return;

    // 1. Eliminar en Supabase
    if (visitaAEliminar.id) {
        const { error } = await db
            .from('visitas')
            .delete()
            .eq('id', visitaAEliminar.id);

        if (error) {
            console.error("Error eliminando visita en Supabase:", error);
            alert("❌ No se pudo eliminar la visita.");
            return;
        }
    }

    // 2. Eliminar localmente
    p.visitas = p.visitas.filter(v => v.num !== num);

    // 3. Reordenar numeración
    p.visitas = p.visitas
        .sort((a, b) => a.fecha.localeCompare(b.fecha))
        .map((v, idx) => ({
            ...v,
            num: idx + 1
        }));

    // 4. Recalcular y guardar última visita
    const okUltima = await actualizarUltimaVisitaPaciente(p);
    if (!okUltima) {
        alert("❌ La visita se eliminó, pero no se pudo actualizar la última visita.");
        return;
    }

    // 5. Guardar respaldo local y refrescar UI
    savePatients();
    renderVisitas();
    renderTable();

    alert("✅ Visita eliminada correctamente.");
}
// --- RECEPCIÓN DE ARTÍCULOS KINESIOLÓGICOS ---
let artCanvas, artCtx;
let artProfCanvas, artProfCtx;

function openArticuloModal() {
    // ACCIÓN 1: APERTURA INMEDIATA (INLINE VIEW)
    const container = document.getElementById('articuloFormContainer');
    if (container) {
        container.style.display = 'block';
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    console.log("Formulario abierto (Inline)");

    // ACCIÓN 2: LÓGICA SECUNDARIA ASÍNCRONA
    setTimeout(() => {
        const p = patients.find(x => x.id === currentPatientId);
        if (!p) return;

        const form = document.getElementById('articuloForm');
        if (form) form.reset();
        applyCurrentUserProfessionalProfile();

        document.getElementById('artFecha').value = new Date().toISOString().split('T')[0];
        document.getElementById('artRelacion').value = 'Paciente';
        document.getElementById('artProf').value = currentProfesional === 'terapeuta' ? (currentProfesionalNombre || '') : '';
        document.getElementById('artProf').disabled = !isCurrentUserAdmin();

        // Reset art signature source
        const defaultRadio = document.querySelector('input[name="artFirmaTipo"][value="manual"]');
        if (defaultRadio) {
            defaultRadio.checked = true;
            toggleArtSignatureSource('manual');
        }
        artFileSignatureBase64 = null;
        artCameraSignatureBase64 = null;
        const artPrev = document.getElementById('artFirmaArchivoPreview');
        if (artPrev) artPrev.style.display = 'none';
        const artFileInput = document.getElementById('artFirmaArchivo');
        if (artFileInput) artFileInput.value = '';

        initArtSignature();
        console.log("Lógica de formulario cargada");
    }, 0);
}

function closeArticuloForm() {
    const container = document.getElementById('articuloFormContainer');
    if (container) container.style.display = 'none';
    stopArtCamera();
}

function initArtSignature() {
    artCanvas = document.getElementById('artSignatureCanvas');
    if (!artCanvas) {
        console.warn('artSignatureCanvas no encontrado');
        return;
    }

    artCtx = artCanvas.getContext('2d');

    // Ajustar tamaño real del canvas al visual
    const rect = artCanvas.getBoundingClientRect();
    if (rect.width > 0) {
        artCanvas.width = rect.width;
        artCanvas.height = rect.height;
    }

    artCtx.lineWidth = 2.5;
    artCtx.lineCap = 'round';
    artCtx.lineJoin = 'round';
    artCtx.strokeStyle = '#1e293b';

    let drawing = false;

    const getPos = (e) => {
        const r = artCanvas.getBoundingClientRect();
        return {
            x: (e.touches ? e.touches[0].clientX : e.clientX) - r.left,
            y: (e.touches ? e.touches[0].clientY : e.clientY) - r.top
        };
    };

    // Remover listeners anteriores clonando el canvas
    const newCanvas = artCanvas.cloneNode(true);
    artCanvas.parentNode.replaceChild(newCanvas, artCanvas);
    artCanvas = newCanvas;
    artCtx = artCanvas.getContext('2d');
    artCtx.lineWidth = 2.5;
    artCtx.lineCap = 'round';
    artCtx.lineJoin = 'round';
    artCtx.strokeStyle = '#1e293b';

    artCanvas.addEventListener('mousedown', (e) => {
        drawing = true;
        const p = getPos(e);
        artCtx.beginPath();
        artCtx.moveTo(p.x, p.y);
    });
    artCanvas.addEventListener('mousemove', (e) => {
        if (!drawing) return;
        const p = getPos(e);
        artCtx.lineTo(p.x, p.y);
        artCtx.stroke();
    });
    window.addEventListener('mouseup', () => { drawing = false; });

    artCanvas.addEventListener('touchstart', (e) => {
        drawing = true;
        const p = getPos(e);
        artCtx.beginPath();
        artCtx.moveTo(p.x, p.y);
        e.preventDefault();
    }, { passive: false });
    artCanvas.addEventListener('touchmove', (e) => {
        if (!drawing) return;
        const p = getPos(e);
        artCtx.lineTo(p.x, p.y);
        artCtx.stroke();
        e.preventDefault();
    }, { passive: false });
    artCanvas.addEventListener('touchend', () => { drawing = false; });
}

// Nueva firma profesional en modal
let modalArtProfCanvas, modalArtProfCtx;
let currentArtIdForSignature = null;

function initModalProfSignature() {
    modalArtProfCanvas = document.getElementById('modalArtProfSignatureCanvas');
    if (!modalArtProfCanvas) return;

    modalArtProfCtx = modalArtProfCanvas.getContext('2d');

    const rect = modalArtProfCanvas.getBoundingClientRect();
    modalArtProfCanvas.width = rect.width;
    modalArtProfCanvas.height = rect.height;
    modalArtProfCtx.lineWidth = 2.5;
    modalArtProfCtx.lineCap = 'round';
    modalArtProfCtx.lineJoin = 'round';
    modalArtProfCtx.strokeStyle = '#000';

    let drawing = false;
    const getPos = (e) => {
        const r = modalArtProfCanvas.getBoundingClientRect();
        return {
            x: (e.touches ? e.touches[0].clientX : e.clientX) - r.left,
            y: (e.touches ? e.touches[0].clientY : e.clientY) - r.top
        };
    };

    modalArtProfCanvas.onmousedown = (e) => { drawing = true; modalArtProfCtx.beginPath(); const p = getPos(e); modalArtProfCtx.moveTo(p.x, p.y); };
    modalArtProfCanvas.onmousemove = (e) => { if (!drawing) return; const p = getPos(e); modalArtProfCtx.lineTo(p.x, p.y); modalArtProfCtx.stroke(); };
    window.onmouseup = () => { drawing = false; };

    modalArtProfCanvas.ontouchstart = (e) => { drawing = true; modalArtProfCtx.beginPath(); const p = getPos(e); modalArtProfCtx.moveTo(p.x, p.y); e.preventDefault(); };
    modalArtProfCanvas.ontouchmove = (e) => { if (!drawing) return; const p = getPos(e); modalArtProfCtx.lineTo(p.x, p.y); modalArtProfCtx.stroke(); e.preventDefault(); };
    modalArtProfCanvas.ontouchend = () => { drawing = false; };
}

function clearModalArtProfSignature() { if (modalArtProfCtx) modalArtProfCtx.clearRect(0, 0, modalArtProfCanvas.width, modalArtProfCanvas.height); }

function openProfSignatureModal(artId) {
    currentArtIdForSignature = artId;
    document.getElementById('artProfSignatureModal').classList.add('active');
    setTimeout(initModalProfSignature, 300);

    // Listener para el botón guardar (limpiar previos para evitar duplicados)
    const saveBtn = document.getElementById('saveProfSigBtn');
    const newBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newBtn, saveBtn);
    newBtn.addEventListener('click', saveProfSignature);
}

async function saveProfSignature() {
    const p = patients.find(x => x.id === currentPatientId);
    if (!p || !currentArtIdForSignature) return;

    const blank = document.createElement('canvas');
    blank.width = modalArtProfCanvas.width;
    blank.height = modalArtProfCanvas.height;

    if (modalArtProfCanvas.toDataURL() === blank.toDataURL()) {
        alert("Por favor, registre su firma antes de guardar.");
        return;
    }

    const art = p.entregas.find(a => a.id === currentArtIdForSignature);
    if (!art) return;

    const firmaProfBase64 = modalArtProfCanvas.toDataURL();

    const ok = await syncFirmaProfesionalEntrega(currentArtIdForSignature, firmaProfBase64);
    if (!ok) return;

    art.firmaProf = firmaProfBase64;

    savePatients();
    renderArticulos();
    closeModal('artProfSignatureModal');
    alert("✅ Firma del profesional guardada correctamente.");
}

   

function clearArtSignature() { if (artCtx) artCtx.clearRect(0, 0, artCanvas.width, artCanvas.height); }

// --- LÓGICA MULTI-FUENTE DE FIRMA PARA ARTÍCULOS ---
let currentArtSignatureType = 'manual';
let artCameraStream = null;
let artFileSignatureBase64 = null;
let artCameraSignatureBase64 = null;

function toggleArtSignatureSource(type) {
    currentArtSignatureType = type;
    document.querySelectorAll('.art-sig-source-container').forEach(el => el.style.display = 'none');

    if (type === 'manual') {
        document.getElementById('artSigSourceManual').style.display = 'block';
        stopArtCamera();
    } else if (type === 'archivo') {
        document.getElementById('artSigSourceArchivo').style.display = 'block';
        stopArtCamera();
    } else if (type === 'camara') {
        document.getElementById('artSigSourceCamara').style.display = 'block';
        startArtCamera();
    }
}

function handleArtSignatureFile(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            artFileSignatureBase64 = e.target.result;
            document.getElementById('artFirmaArchivoPreview').style.display = 'block';
            document.getElementById('artImgFirmaPrev').src = artFileSignatureBase64;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

async function startArtCamera() {
    const video = document.getElementById('artSignatureVideo');
    if (!video) return;

    document.getElementById('artCameraControls').style.display = 'block';
    document.getElementById('artCameraPreview').style.display = 'none';

    try {
        artCameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
        });
        video.srcObject = artCameraStream;
    } catch (err) {
        console.error("Error al acceder a la cámara:", err);
        alert("No se pudo acceder a la cámara. Verifique los permisos.");
    }
}

function stopArtCamera() {
    if (artCameraStream) {
        artCameraStream.getTracks().forEach(track => track.stop());
        artCameraStream = null;
    }
}

function captureFromArtCamera() {
    const video = document.getElementById('artSignatureVideo');
    const canvas = document.getElementById('artCameraResultCanvas');
    if (!video || !canvas) return;

    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    artCameraSignatureBase64 = canvas.toDataURL('image/png');

    document.getElementById('artCameraControls').style.display = 'none';
    document.getElementById('artCameraPreview').style.display = 'block';
    stopArtCamera();
}

function resetArtCamera() {
    artCameraSignatureBase64 = null;
    startArtCamera();
}

document.getElementById('articuloForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = document.getElementById('articuloForm');
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn.disabled) return;

    submitBtn.disabled = true;
    submitBtn.dataset.originalText = submitBtn.textContent;
    submitBtn.textContent = 'Guardando...';
    submitBtn.style.pointerEvents = 'none';
    submitBtn.style.opacity = '0.7';

    try {
        const p = patients.find(x => x.id === currentPatientId);
        if (!p) throw new Error('No se encontró el paciente.');

        let finalFirmaBase64 = null;

        if (currentArtSignatureType === 'manual') {
            finalFirmaBase64 = captureSignatureToBase64(artCanvas);
        } else if (currentArtSignatureType === 'archivo') {
            finalFirmaBase64 = artFileSignatureBase64;
        } else if (currentArtSignatureType === 'camara') {
            finalFirmaBase64 = artCameraSignatureBase64;
        }

        if (!finalFirmaBase64) {
            throw new Error(
                currentArtSignatureType === 'manual'
                    ? 'La firma manual es obligatoria.'
                    : currentArtSignatureType === 'archivo'
                        ? 'Debe seleccionar una imagen.'
                        : 'Debe capturar una foto.'
            );
        }

        const data = {
            id: null,
            tipo: document.getElementById('artTipo').value,
            desc: document.getElementById('artDesc').value,
            estado: 'Nuevo',
            fecha: document.getElementById('artFecha').value,
            prof: document.getElementById('artProf').value,
            firma: finalFirmaBase64,
            firmaProf: '',
            firmanteNombre: document.getElementById('artFirmaNombre').value,
            firmaRut: document.getElementById('artFirmaRut').value,
            relacion: document.getElementById('artRelacion').value
        };

        const entregaGuardada = await syncEntregaToSupabase(data, p.id);
        if (!entregaGuardada) throw new Error('No se pudo guardar la entrega.');

        const entregaFinal = {
            id: entregaGuardada.id,
            tipo: entregaGuardada.articulo_tipo,
            desc: entregaGuardada.descripcion,
            estado: entregaGuardada.estado || 'Nuevo',
            fecha: entregaGuardada.fecha,
            prof: entregaGuardada.profesional,
            firma: entregaGuardada.firma_paciente_base64,
            firmaProf: entregaGuardada.firma_profesional_base64 || '',
            firmanteNombre: entregaGuardada.firmante_nombre,
            firmaRut: entregaGuardada.firmante_rut,
            relacion: entregaGuardada.relacion
        };

        if (!p.entregas) p.entregas = [];
        p.entregas.unshift(entregaFinal);

        savePatients();
        renderArticulos();

        form.reset();
        closeArticuloForm();

        alert("✅ Entrega guardada correctamente.");
    } catch (error) {
        console.error("Error final en entrega:", error);
        alert("❌ " + (error.message || "Ocurrió un error al guardar la entrega."));
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.dataset.originalText || '💾 Guardar entrega';
        submitBtn.style.pointerEvents = 'auto';
        submitBtn.style.opacity = '1';
    }
});

function prepareArticuloPrint(data, p) {
    // ACTIVAR SOLO ESTE CONTENEDOR PARA IMPRESIÓN
    setActivePrintContainer('printArticuloContainer');

    document.getElementById('partNombre').textContent = p.nombre;
    document.getElementById('partRut').textContent = p.rut;
    document.getElementById('partDir').textContent = p.domicilio;
    document.getElementById('partTel').textContent = p.telefono || 'No registrado';

    document.getElementById('partTipo').textContent = data.tipo;
    document.getElementById('partDesc').textContent = data.desc;
    document.getElementById('partFecha').textContent = data.fecha.split('-').reverse().join('/');
    document.getElementById('partProf').textContent = data.prof;

    document.getElementById('partFirmaImg').src = data.firma;
    document.getElementById('partProfFirmaImg').src = data.firmaProf || '';
    document.getElementById('partFirmanteNombre').textContent = data.firmanteNombre;
    document.getElementById('partFirmanteRel').textContent = `${data.relacion || '---'}${data.firmaRut ? ' | RUT: ' + data.firmaRut : ''}`;
}

function renderArticulos() {
    const container = document.getElementById('articulosList');
    if (!container) return;
    container.innerHTML = '';

    const p = patients.find(x => x.id === currentPatientId);
    if (!p || !p.entregas) return;

    if (p.entregas.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: var(--text-tertiary); background: rgba(0,0,0,0.01); border-radius: 15px; border: 1px dashed #ddd;">
                No hay registros de entrega de artículos.
            </div>
        `;
        return;
    }

    p.entregas.forEach(art => {
        const card = document.createElement('div');
        card.className = 'session-card';
        card.style.borderLeftColor = '#6366f1';

        const isSigned = art.firmaProf && art.firmaProf.length > 500;

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="flex: 1;">
                    <span class="session-badge" style="background: rgba(99, 102, 241, 0.1); color: #4338ca;">📦 Entrega</span>
                    <h4 style="margin: 10px 0 5px 0; color: #4338ca;">${art.tipo}</h4>
                    <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">${art.desc}</p>
                    <p style="margin: 5px 0 10px 0; font-size: 0.8rem; color: var(--text-tertiary);"><strong>Fecha:</strong> ${art.fecha.split('-').reverse().join('/')}</p>
                    
                    ${isSigned ?
                `<div style="display: flex; align-items: center; gap: 5px; color: #10b981; font-size: 0.8rem; font-weight: 600;">
                            <span>✔</span> Firmado por profesional
                        </div>` :
                `<div style="color: #f59e0b; font-size: 0.8rem; font-weight: 600;">
                            ⚠️ Pendiente firma profesional
                        </div>`
            }
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <button class="btn-outline" style="padding: 6px 12px; font-size: 0.75rem; width: 100%;" onclick="reprintArticulo('${art.id}')">🖨️ Imprimir</button>
                    ${!isSigned ?
                `<button class="btn-primary" style="padding: 6px 12px; font-size: 0.75rem; background: #6366f1; border-color: #6366f1; width: 100%;" onclick="openProfSignatureModal('${art.id}')">🖋️ Firma del profesional</button>` :
                ''
            }
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function captureCurrentTestData(config) {
    const rawData = {};
    const allFields = config.sections
        ? config.sections.flatMap(s => s.fields)
        : (config.fields || []);

    allFields.forEach(f => {
        // Ignorar campos decorativos o de información
        if (['info-block', 'info-text', 'interpretation-guide', 'suggested-classification'].includes(f.type)) return;

        // Verificar si el campo está oculto por una condición
        const group = document.getElementById('group_' + f.id);
        if (group && group.style.display === 'none') return;

        if (f.type === 'sex-selector') {
            // Capturar el radio button del sex-selector (name = f.id)
            const checked = document.querySelector(`input[name="${f.id}"]:checked`);
            rawData[f.id] = checked ? checked.value : '';
        } else if (f.type === 'radio-grid') {
            rawData[f.id] = {};
            (f.rows || []).forEach(row => {
                const safeRow = row.replace(/\s+/g, '');
                const gridEl = document.querySelector(`input[name="${f.id}_${safeRow}"]:checked`);
                rawData[f.id][row] = gridEl ? gridEl.value : '';
            });
        } else if (f.type === 'checkbox') {
            const checked = document.querySelectorAll(`input[name="${f.id}"]:checked`);
            rawData[f.id] = Array.from(checked).map(el => el.value);
        } else if (f.type === 'radio') {
            const checked = document.querySelector(`input[name="${f.id}"]:checked`);
            rawData[f.id] = checked ? checked.value : '';
        } else if (f.type === 'scored-yesno') {
            const checked = document.querySelector(`input[name="${f.id}_yn"]:checked`);
            rawData[f.id] = checked ? checked.value : '';
        } else if (f.type === 'hamilton-row') {
            const checked = document.querySelector(`input[name="${f.id}_val"]:checked`);
            rawData[f.id] = checked ? checked.value : '';
        } else if (f.type === 'scored-option-list') {
            const checked = document.querySelector(`input[name="${f.id}_opt"]:checked`);
            rawData[f.id] = checked ? checked.value : '';
        } else if (f.type === 'mmse-row') {
            const scoreEl = document.getElementById(f.id);
            const textEl = document.getElementById(f.id + '_text');
            rawData[f.id] = {
                score: scoreEl ? scoreEl.value : '',
                text: textEl ? textEl.value : ''
            };
        } else {
            const el = document.getElementById(f.id);
            if (el) rawData[f.id] = el.value;
        }
    });
    return rawData;
}

function printCurrentTest() {
    // 1. Verificar paciente activo
    const p = patients.find(x => x.id === currentPatientId);
    if (!p) { alert("Selecciona un paciente primero."); return; }

    // 2. Buscar config: primero por ID global, luego por título visible
    let config = testsConfig[currentTestId] || null;
    if (!config) {
        const titleText = (document.getElementById('testTitle') || {}).textContent || '';
        config = Object.values(testsConfig).find(c => c.title.trim() === titleText.trim()) || null;
    }

    // 3. Si no hay config, hacer impresión básica del formulario visible
    if (!config) {
        printFormularioVisible(p);
        return;
    }

    // 4. Capturar datos actuales y enviar a impresión corregida
    const currentData = captureCurrentTestData(config);
    const tempDoc = {
        titulo: config.title,
        fecha: new Date().toLocaleDateString('es-CL'),
        rawData: currentData,
        profesional: currentProfesionalNombre,
        area: currentProfesional,
        isTest: true
    };

    renderDocToPrintContainer_FIXED(tempDoc, p, config);
}

// Impresión de emergencia: captura el HTML visible del formulario
function printFormularioVisible(p) {
    const formulario = document.getElementById('testFieldsContainer');
    const titulo = (document.getElementById('testTitle') || {}).textContent || 'Formulario';
    const container = document.getElementById('prTestContent');
    const signatureArea = document.getElementById('dynamicSignatureArea');
    if (container) container.innerHTML = '';
    if (signatureArea) signatureArea.innerHTML = '';

    // Llenar cabecera
    document.getElementById('prTestMainTitle').textContent = titulo.toUpperCase();
    document.getElementById('prTestNombre').textContent = p.nombre || '---';
    document.getElementById('prTestRut').textContent = p.rut || '---';
    document.getElementById('prTestEdad').textContent = (p.edad || '-') + ' años';
    document.getElementById('prTestFecha').textContent = new Date().toLocaleDateString('es-CL');
    document.getElementById('prTestDir').textContent = p.domicilio || '---';
    document.getElementById('prTestProf').textContent = currentProfesional === 'psicologo' ? 'Psicólogo/a' : 'Terapeuta Ocupacional';

    // Capturar texto de todas las preguntas y respuestas del formulario activo
    if (container && formulario) {
        const printDiv = document.createElement('div');
        printDiv.innerHTML = '<p style="font-size:8pt;color:#1e3a8a;text-align:right;margin-bottom:10px;">Impresión directa del formulario activo</p>';

        const groups = formulario.querySelectorAll('.field-group, [id^="group_"]');
        groups.forEach(group => {
            if (group.style.display === 'none') return;
            const label = group.querySelector('label, .field-label');
            const labelText = label ? label.textContent.trim() : '';
            if (!labelText) return;

            const sectionDiv = document.createElement('div');
            sectionDiv.style.marginBottom = '12px';
            sectionDiv.style.paddingBottom = '8px';
            sectionDiv.style.borderBottom = '1px solid #f0f0f0';

            let answer = '---';
            const input = group.querySelector('input:not([type=radio]):not([type=checkbox]), textarea, select');
            const checkedRadio = group.querySelector('input[type=radio]:checked, input[type=checkbox]:checked');
            const allChecked = group.querySelectorAll('input[type=checkbox]:checked');

            if (allChecked.length > 1) {
                answer = Array.from(allChecked).map(el => el.value || el.parentElement.textContent.trim()).join(', ');
            } else if (checkedRadio) {
                answer = checkedRadio.value || checkedRadio.parentElement.textContent.trim();
            } else if (input && input.value) {
                answer = input.value;
            }

            sectionDiv.innerHTML = `
                <p style="margin:0 0 4px 0;font-size:9pt;font-weight:bold;color:#1e3a8a;">${labelText}</p>
                <p style="margin:0;font-size:9pt;color:#334155;padding:4px 8px;background:#f8fafc;border-left:3px solid #94a3b8;">${answer}</p>
            `;
            printDiv.appendChild(sectionDiv);
        });
        container.appendChild(printDiv);
    }

    setActivePrintContainer('formulario-imprimible');
    setTimeout(() => window.print(), 400);
}

function printCurrentTestWithConfig(p, config) {
    try {
        // Capturar datos directamente del DOM del formulario activo
        const draftData = captureCurrentTestData(config);

        // Asegurar que sections esté definido para el renderizador (necesario para Lawton)
        const sections = config.sections
            ? config.sections
            : [{ title: config.title, fields: config.fields || [] }];

        const tempDoc = {
            titulo: config.title,
            fecha: new Date().toLocaleDateString('es-CL'),
            rawData: draftData,
            profesional: currentProfesional,
            isTest: true
        };

        // Pasar el config normalizado (con sections) al renderizador
        const normalizedConfig = { ...config, sections };
        renderDocToPrintContainer(tempDoc, p, normalizedConfig);
    } catch (err) {
        console.error("Error en printCurrentTestWithConfig:", err);
        alert("Error al preparar el informe: " + err.message);
    }
}

function printTestDoc(docId) {
    const p = patients.find(x => x.id === currentPatientId);
    if (!p) return;
    const doc = p.docs.find(d => d.id === docId);

    // Si no hay doc (pestaña abierta o error), intentar imprimir el actual
    if (!doc) {
        return printCurrentTest();
    }

    const config = Object.values(testsConfig).find(c => c.title.trim() === doc.titulo.trim());
    renderDocToPrintContainer(doc, p, config);
}

// === MOTOR DE IMPRESIÓN PERSONALIZADO: EVALUACIÓN PSICOLÓGICA INICIAL ===
function renderEvalPsicologicaPrint(doc, p, config) {
    const container = document.getElementById('prTestContent');
    const signatureArea = document.getElementById('dynamicSignatureArea');
    const data = doc.rawData || {};

    container.innerHTML = '';
    if (signatureArea) signatureArea.innerHTML = '';

    // 1. ENCABEZADO
    document.getElementById('prTestMainTitle').textContent = 'INFORME DE EVALUACIÓN PSICOLÓGICA INICIAL';
    document.getElementById('prTestNombre').textContent = p.nombre || '---';
    document.getElementById('prTestRut').textContent = p.rut || '---';
    document.getElementById('prTestEdad').textContent = (p.edad || '-') + ' años';
    document.getElementById('prTestFecha').textContent = doc.fecha || '---';
    document.getElementById('prTestDir').textContent = p.domicilio || '---';
    document.getElementById('prTestProf').textContent = doc.profesional || '---';

    // Helper for values
    const val = (id) => data[id] ? data[id] : '---';
    const isChecked = (id, option) => {
        if (!data[id]) return false;
        if (Array.isArray(data[id])) return data[id].includes(option);
        return data[id] === option;
    };

    let html = '';

    // --- SECCIÓN I (MORADO) ---
    html += `
        <div style="margin-bottom: 25px; page-break-inside: avoid;">
            <h3 style="background: #eef2ff !important; color: #4f46e5 !important; border-left: 5px solid #4f46e5; padding: 10px 15px; margin-bottom: 15px; font-size: 11pt; font-weight: bold;">I. PRESENTACIÓN Y ENCUADRE DEL PROCESO</h3>
            <div style="padding-left: 15px;">
    `;
    const encuadreOpts = [
        'Presentación personal', 'Explicación del proceso', 'Confidencialidad',
        'Objetivo del proceso', 'Derechos del beneficiario', 'Consentimiento verbal'
    ];
    html += `<ul style="margin: 0 0 10px 0; padding-left: 0; list-style: none;">`;
    encuadreOpts.forEach((opt, idx) => {
        const checked = data['ep_encuadre'] && data['ep_encuadre'].some(v => v.includes(opt)) ? '☑' : '☐';
        html += `<li style="font-size: 9pt; margin-bottom: 6px; display: flex; align-items: flex-start; gap: 8px;">
            <span style="font-size: 11pt; line-height: 1; flex-shrink: 0; color: ${data['ep_encuadre'] && data['ep_encuadre'].some(v => v.includes(opt)) ? '#059669' : '#94a3b8'};">${checked}</span>
            <span><strong>1.${idx + 1}</strong> ${opt}</span>
        </li>`;
    });
    html += `</ul>`;
    html += `
                <div style="margin-top: 10px;">
                    <p style="margin: 0 0 5px 0; font-size: 9pt; font-weight: bold; color: #334155;">1.7 ¿Tiene alguna pregunta sobre cómo funcionará este proceso?</p>
                    <div style="padding: 10px; background: #fdfdfd; border-left: 3px solid #cbd5e1; font-size: 9pt; white-space: pre-wrap; min-height: 20px;"><strong>Respuesta: </strong>${val('ep_pregunta_proceso')}</div>
                </div>
            </div>
        </div>
    `;

    // --- SECCIÓN II (VERDE) ---
    html += `
        <div style="margin-bottom: 25px; page-break-inside: avoid;">
            <h3 style="background: #ecfdf5 !important; color: #059669 !important; border-left: 5px solid #059669; padding: 10px 15px; margin-bottom: 15px; font-size: 11pt; font-weight: bold;">II. EXPLORACIÓN DE LA HISTORIA VITAL</h3>
            
            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 2px 0; font-size: 9pt; font-weight: bold; color: #334155;">2.1 ¿Cómo está su salud en general?</p>
                <p style="margin: 0 0 5px 0; font-size: 8pt; font-style: italic; color: #64748b;">Nota clínica: (Enfermedades crónicas, dolor, impacto en el día a día)</p>
                <div style="padding: 10px; background: #fdfdfd; border-bottom: 1px solid #e2e8f0; font-size: 9pt; white-space: pre-wrap; min-height: 20px;">${val('ep_salud_gen')}</div>
            </div>

            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 2px 0; font-size: 9pt; font-weight: bold; color: #334155;">2.2 Vida anterior</p>
                <p style="margin: 0 0 5px 0; font-size: 8pt; font-style: italic; color: #64748b;">Nota clínica: (Cómo era su vida hace 1-2 años, cambios percibidos)</p>
                <div style="padding: 10px; background: #fdfdfd; border-bottom: 1px solid #e2e8f0; font-size: 9pt; white-space: pre-wrap; min-height: 20px;">${val('ep_vida_pasada')}</div>
            </div>

            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 5px 0; font-size: 9pt; font-weight: bold; color: #334155;">2.3 Pérdidas recientes</p>
                <div style="font-size: 9pt; margin-bottom: 5px;">¿Ha perdido a alguna persona cercana?: ${isChecked('ep_perdida_sn', 'Sí') ? '☑ Sí' : '☐ Sí'} &nbsp; ${isChecked('ep_perdida_sn', 'No') ? '☑ No' : '☐ No'}</div>
                <div style="padding: 10px; background: #fdfdfd; border-bottom: 1px solid #e2e8f0; font-size: 9pt; white-space: pre-wrap; min-height: 20px;">${val('ep_perdida_det')}</div>
            </div>

            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 2px 0; font-size: 9pt; font-weight: bold; color: #334155;">2.4 Actividades dejadas</p>
                <p style="margin: 0 0 5px 0; font-size: 8pt; font-style: italic; color: #64748b;">Nota clínica: (Impacto emocional por dejar de hacer actividades/roles)</p>
                <div style="padding: 10px; background: #fdfdfd; border-bottom: 1px solid #e2e8f0; font-size: 9pt; white-space: pre-wrap; min-height: 20px;">${val('ep_dejar_cosas')}</div>
            </div>

            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 5px 0; font-size: 9pt; font-weight: bold; color: #334155;">2.5 Rutina y Hábitos Básicos</p>
                <div style="display: flex; gap: 20px;">
                    <div style="font-size: 9pt;"><strong>Sueño:</strong> ${isChecked('ep_sueno', 'Bueno') ? '☑ Bueno' : '☐ Bueno'} ${isChecked('ep_sueno', 'Regular') ? '☑ Reg.' : '☐ Reg.'} ${isChecked('ep_sueno', 'Malo') ? '☑ Malo' : '☐ Malo'}</div>
                    <div style="font-size: 9pt;"><strong>Apetito:</strong> ${isChecked('ep_apetito', 'Bueno') ? '☑ Bueno' : '☐ Bueno'} ${isChecked('ep_apetito', 'Regular') ? '☑ Reg.' : '☐ Reg.'} ${isChecked('ep_apetito', 'Malo') ? '☑ Malo' : '☐ Malo'}</div>
                    <div style="font-size: 9pt;"><strong>Energía:</strong> ${isChecked('ep_energia', 'Buena') ? '☑ Buena' : '☐ Buena'} ${isChecked('ep_energia', 'Regular') ? '☑ Reg.' : '☐ Reg.'} ${isChecked('ep_energia', 'Baja') ? '☑ Baja' : '☐ Baja'}</div>
                </div>
                <div style="margin-top: 5px; padding: 10px; background: #fdfdfd; border-bottom: 1px solid #e2e8f0; font-size: 9pt; white-space: pre-wrap; min-height: 20px;">${val('ep_cambios_rutina')}</div>
            </div>
        </div>
    `;

    // --- SECCIÓN III (ROJO) ---
    const renderLikert = (id, options) => {
        let res = `<div style="display: flex; gap: 15px; font-size: 8.5pt; margin-bottom: 5px; flex-wrap: wrap;">`;
        options.forEach(opt => {
            res += `<span>${isChecked(id, opt) ? '☑' : '☐'} ${opt}</span>`;
        });
        res += `</div>`;
        return res;
    };

    html += `
        <div style="margin-bottom: 25px; page-break-inside: avoid;">
            <h3 style="background: #fef2f2 !important; color: #dc2626 !important; border-left: 5px solid #dc2626; padding: 10px 15px; margin-bottom: 15px; font-size: 11pt; font-weight: bold;">III. IDENTIFICACIÓN DE PREOCUPACIONES ACTUALES</h3>
            
            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 5px 0; font-size: 9pt; font-weight: bold; color: #334155;">3.1 Preocupación principal:</p>
                <div style="padding: 10px; background: #fdfdfd; border-bottom: 1px solid #e2e8f0; font-size: 9pt; white-space: pre-wrap; min-height: 20px;">${val('ep_preoc_actual')}</div>
            </div>

            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 5px 0; font-size: 9pt; font-weight: bold; color: #334155;">3.2 Miedo a caerse:</p>
                <div style="font-size: 9pt; margin-bottom: 5px;">${isChecked('ep_miedo_caer', 'Sí') ? '☑ Sí' : '☐ Sí'} &nbsp; ${isChecked('ep_miedo_caer', 'No') ? '☑ No' : '☐ No'}</div>
                <div style="padding: 10px; background: #fdfdfd; border-bottom: 1px solid #e2e8f0; font-size: 9pt; white-space: pre-wrap; min-height: 20px;">${val('ep_miedo_det')}</div>
            </div>

            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 5px 0; font-size: 9pt; font-weight: bold; color: #334155;">3.3 Preocupación por salud:</p>
                <div style="padding: 10px; background: #fdfdfd; border-bottom: 1px solid #e2e8f0; font-size: 9pt; white-space: pre-wrap; min-height: 20px;">${val('ep_preoc_salud')}</div>
            </div>

            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 5px 0; font-size: 9pt; font-weight: bold; color: #334155;">3.4 Ideación de muerte:</p>
                <div style="padding: 10px; background: #fdfdfd; border-bottom: 1px solid #e2e8f0; font-size: 9pt; white-space: pre-wrap; min-height: 20px;">${val('ep_muerte')}</div>
            </div>

            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 5px 0; font-size: 9pt; font-weight: bold; color: #334155;">3.5 Soledad percibida:</p>
                ${renderLikert('ep_soledad_frec', ['Nunca', 'Rara vez', 'A veces', 'Con frecuencia', 'Casi siempre'])}
                <div style="padding: 10px; background: #fdfdfd; border-bottom: 1px solid #e2e8f0; font-size: 9pt; white-space: pre-wrap; min-height: 20px;">${val('ep_soledad_text')}</div>
            </div>

            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 5px 0; font-size: 9pt; font-weight: bold; color: #334155;">3.6 Autonomía percibida:</p>
                ${renderLikert('ep_autonomia_frec', ['Nada de autonomía', 'Poca autonomía', 'Algo de autonomía', 'Bastante autonomía', 'Plena autonomía'])}
                <div style="padding: 10px; background: #fdfdfd; border-bottom: 1px solid #e2e8f0; font-size: 9pt; white-space: pre-wrap; min-height: 20px;">${val('ep_autonomia_text')}</div>
            </div>

            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 5px 0; font-size: 9pt; font-weight: bold; color: #334155;">3.7 Tristeza / Ánimo:</p>
                ${renderLikert('ep_tristeza_frec', ['Nunca', 'Casi nunca', 'Algunas veces', 'Con frecuencia', 'Casi siempre'])}
                <div style="padding: 10px; background: #fdfdfd; border-bottom: 1px solid #e2e8f0; font-size: 9pt; white-space: pre-wrap; min-height: 20px;">${val('ep_tristeza_text')}</div>
            </div>

            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 5px 0; font-size: 9pt; font-weight: bold; color: #334155;">3.8 Ansiedad:</p>
                ${renderLikert('ep_ansiedad_frec', ['Nunca', 'Casi nunca', 'Algunas veces', 'Con frecuencia', 'Casi siempre'])}
                <div style="padding: 10px; background: #fdfdfd; border-bottom: 1px solid #e2e8f0; font-size: 9pt; white-space: pre-wrap; min-height: 20px;">${val('ep_ansiedad_text')}</div>
            </div>
        </div>
    `;

    // --- SECCIÓN IV (AZUL) ---
    html += `
        <div style="margin-bottom: 25px; page-break-inside: avoid;">
            <h3 style="background: #eff6ff !important; color: #2563eb !important; border-left: 5px solid #2563eb; padding: 10px 15px; margin-bottom: 15px; font-size: 11pt; font-weight: bold;">IV. RECURSOS PSICOLÓGICOS Y RED DE APOYO</h3>
            
            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 5px 0; font-size: 9pt; font-weight: bold; color: #334155;">4.1 Afrontamiento de dificultades:</p>
                <div style="padding: 10px; background: #fdfdfd; border-bottom: 1px solid #e2e8f0; font-size: 9pt; white-space: pre-wrap; min-height: 20px;">${val('ep_superar')}</div>
            </div>

            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 5px 0; font-size: 9pt; font-weight: bold; color: #334155;">4.2 Fortalezas reconocidas:</p>
                <div style="padding: 10px; background: #fdfdfd; border-bottom: 1px solid #e2e8f0; font-size: 9pt; white-space: pre-wrap; min-height: 20px;">${val('ep_fortalezas')}</div>
            </div>

            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 5px 0; font-size: 9pt; font-weight: bold; color: #334155;">4.3 Red de apoyo:</p>
                ${renderLikert('ep_red_apoyo', ['Pareja', 'Amigos', 'Hijos', 'Vecinos', 'Nietos', 'Profesional de salud', 'Hermanos', 'Líder religioso', 'Otro'])}
                <div style="margin-top: 5px; font-size: 9pt; color: #64748b;">(Otro: ${val('ep_red_otro')})</div>
                <div style="margin-top: 5px; padding: 10px; background: #fdfdfd; border-bottom: 1px solid #e2e8f0; font-size: 9pt; white-space: pre-wrap; min-height: 20px;">${val('ep_apoyo_text')}</div>
            </div>

            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 5px 0; font-size: 9pt; font-weight: bold; color: #334155;">4.4 Sentido de vida hoy:</p>
                <div style="padding: 10px; background: #fdfdfd; border-bottom: 1px solid #e2e8f0; font-size: 9pt; white-space: pre-wrap; min-height: 20px;">${val('ep_sentido_vida')}</div>
            </div>

            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 5px 0; font-size: 9pt; font-weight: bold; color: #334155;">4.5 Participación social:</p>
                <div style="font-size: 9pt; margin-bottom: 5px;">${isChecked('ep_social_sn', 'Sí') ? '☑ Sí' : '☐ Sí'} &nbsp; ${isChecked('ep_social_sn', 'No') ? '☑ No' : '☐ No'}</div>
                <div style="padding: 10px; background: #fdfdfd; border-bottom: 1px solid #e2e8f0; font-size: 9pt; white-space: pre-wrap; min-height: 20px;">${val('ep_social_det')}</div>
            </div>
        </div>
    `;

    // --- SECCIÓN V (YESAVAGE) ---
    const ys_questions = [
        "¿Está básicamente satisfecho con su vida?", "¿Ha abandonado muchos de sus intereses y actividades?",
        "¿Siente que su vida está vacía?", "¿Se aburre a menudo?", "¿Está de buen humor la mayor parte del tiempo?",
        "¿Tiene miedo a que le vaya a pasar algo malo?", "¿Se siente feliz la mayor parte del tiempo?",
        "¿Se siente a menudo impotente?", "¿Prefiere quedarse en casa en lugar de salir y hacer cosas nuevas?",
        "¿Siente que tiene más problemas de memoria que la mayoría?", "¿Cree que es maravilloso estar vivo ahora?",
        "¿Se siente bastante inútil tal y como está ahora?", "¿Se siente lleno de energía?",
        "¿Siente que su situación es desesperanzadora?", "¿Cree que la mayoría de la gente está mejor que usted?"
    ];
    const ys_scores = [0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1]; // Score if Yes

    html += `
        <div style="margin-bottom: 25px; page-break-inside: avoid;">
            <h3 style="background: #f8fafc !important; color: #0f172a !important; border-left: 5px solid #0f172a; padding: 10px 15px; margin-bottom: 15px; font-size: 11pt; font-weight: bold;">V. ESCALA YESAVAGE (GDS-15)</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; border: 1px solid #cbd5e1; font-size: 9pt;">
                <thead>
                    <tr style="background: #f1f5f9;">
                        <th style="padding: 8px; border: 1px solid #cbd5e1; width: 30px;">Nº</th>
                        <th style="text-align: left; padding: 8px; border: 1px solid #cbd5e1;">Pregunta</th>
                        <th style="text-align: center; padding: 8px; border: 1px solid #cbd5e1; width: 50px;">Sí</th>
                        <th style="text-align: center; padding: 8px; border: 1px solid #cbd5e1; width: 50px;">No</th>
                        <th style="text-align: center; padding: 8px; border: 1px solid #cbd5e1; width: 60px;">Puntaje</th>
                    </tr>
                </thead>
                <tbody>
    `;
    let ys_total = 0;
    ys_questions.forEach((q, idx) => {
        const id = `ys_${idx + 1}`;
        const answer = data[id];
        let score = 0;
        let isSi = answer === 'Sí';
        let isNo = answer === 'No';
        if (isSi && ys_scores[idx] === 1) score = 1;
        if (isNo && ys_scores[idx] === 0) score = 1;
        if (isSi || isNo) ys_total += score;

        html += `
            <tr>
                <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center;">${idx + 1}</td>
                <td style="padding: 5px; border: 1px solid #cbd5e1;">${q}</td>
                <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center;">${isSi ? '<b>X</b>' : ''}</td>
                <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center;">${isNo ? '<b>X</b>' : ''}</td>
                <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${(isSi || isNo) ? score : '-'}</td>
            </tr>
        `;
    });

    let ys_interp = "Sin depresión (Normal)";
    let ys_color = '#059669';
    if (ys_total >= 5 && ys_total <= 8) { ys_interp = "Depresión leve"; ys_color = '#d97706'; }
    if (ys_total >= 9) { ys_interp = "Depresión moderada/severa"; ys_color = '#dc2626'; }

    html += `
                </tbody>
                <tfoot>
                    <tr style="background: #f1f5f9; font-weight: bold;">
                        <td colspan="4" style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-size: 9pt; color: #334155;">PUNTAJE TOTAL</td>
                        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-size: 12pt; color: #0f172a;">${ys_total}</td>
                    </tr>
                </tfoot>
            </table>
            <div style="background: #f0fdf4; padding: 12px 16px; border-left: 5px solid ${ys_color}; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                <div>
                    <span style="font-size: 9pt; font-weight: bold; color: #334155; text-transform: uppercase;">Interpretación GDS-15</span>
                    <p style="margin: 3px 0 0 0; font-size: 12pt; font-weight: 700; color: ${ys_color};">${ys_interp}</p>
                </div>
                <div style="font-size: 22pt; font-weight: 900; color: ${ys_color}; border: 3px solid ${ys_color}; border-radius: 8px; padding: 4px 16px; min-width: 60px; text-align: center;">${ys_total}<span style="font-size: 10pt;">/15</span></div>
            </div>
        </div>
    `;

    // --- SECCIÓN VI (GAI) ---
    const gai_questions = [
        "¿Se preocupa mucho por cosas sin importancia?", "¿Tiene dificultad para relajarse?",
        "¿Tiene miedo de que algo malo pase?", "¿Se siente tenso/a?", "¿Se siente irritable?",
        "¿Tiene dificultad para conciliar el sueño por preocupaciones?", "¿Se siente cansado/a fácilmente?",
        "¿Le cuesta concentrarse?", "¿Tiene palpitaciones o falta de aire cuando se preocupa?",
        "¿Se siente inquieto/a?"
    ];
    html += `
        <div style="margin-bottom: 25px; page-break-inside: avoid;">
            <h3 style="background: #f8fafc !important; color: #0f172a !important; border-left: 5px solid #0f172a; padding: 10px 15px; margin-bottom: 15px; font-size: 11pt; font-weight: bold;">VI. ESCALA DE ANSIEDAD (GAI)</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; border: 1px solid #cbd5e1; font-size: 9pt;">
                <thead>
                    <tr style="background: #f1f5f9;">
                        <th style="padding: 8px; border: 1px solid #cbd5e1; width: 30px;">Nº</th>
                        <th style="text-align: left; padding: 8px; border: 1px solid #cbd5e1;">Pregunta</th>
                        <th style="text-align: center; padding: 8px; border: 1px solid #cbd5e1; width: 50px;">Sí</th>
                        <th style="text-align: center; padding: 8px; border: 1px solid #cbd5e1; width: 50px;">No</th>
                        <th style="text-align: center; padding: 8px; border: 1px solid #cbd5e1; width: 60px;">Puntaje</th>
                    </tr>
                </thead>
                <tbody>
    `;
    let gai_total = 0;
    gai_questions.forEach((q, idx) => {
        const id = `gai_${idx + 1}`;
        const answer = data[id];
        let isSi = answer === 'Sí';
        let isNo = answer === 'No';
        const score = isSi ? 1 : 0;
        if (isSi) gai_total += 1;

        html += `
            <tr>
                <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center;">${idx + 1}</td>
                <td style="padding: 5px; border: 1px solid #cbd5e1;">${q}</td>
                <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center;">${isSi ? '<b>X</b>' : ''}</td>
                <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center;">${isNo ? '<b>X</b>' : ''}</td>
                <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #1e3a8a;">${(isSi || isNo) ? score : '-'}</td>
            </tr>
        `;
    });

    let gai_interp = "Sin ansiedad clínicamente significativa";
    let gai_color = '#059669';
    if (gai_total >= 5 && gai_total <= 7) { gai_interp = "Ansiedad leve"; gai_color = '#d97706'; }
    if (gai_total >= 8) { gai_interp = "Ansiedad significativa / Severa"; gai_color = '#dc2626'; }

    html += `
                </tbody>
                <tfoot>
                    <tr style="background: #f1f5f9; font-weight: bold;">
                        <td colspan="4" style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-size: 9pt; color: #334155;">PUNTAJE TOTAL</td>
                        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-size: 12pt; color: #0f172a;">${gai_total}</td>
                    </tr>
                </tfoot>
            </table>
            <div style="background: #f0fdf4; padding: 12px 16px; border-left: 5px solid ${gai_color}; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                <div>
                    <span style="font-size: 9pt; font-weight: bold; color: #334155; text-transform: uppercase;">Interpretación GAI</span>
                    <p style="margin: 3px 0 0 0; font-size: 12pt; font-weight: 700; color: ${gai_color};">${gai_interp}</p>
                </div>
                <div style="font-size: 22pt; font-weight: 900; color: ${gai_color}; border: 3px solid ${gai_color}; border-radius: 8px; padding: 4px 16px; min-width: 60px; text-align: center;">${gai_total}<span style="font-size: 10pt;">/10</span></div>
            </div>
        </div>
    `;

    // --- SECCIÓN VII (SÍNTESIS CLÍNICA) ---
    html += `
        <div style="margin-bottom: 25px; page-break-inside: avoid;">
            <h3 style="background: #f8fafc !important; color: #0f172a !important; border-left: 5px solid #0f172a; padding: 10px 15px; margin-bottom: 15px; font-size: 11pt; font-weight: bold;">VII. SÍNTESIS CLÍNICA FINAL</h3>
            
            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 5px 0; font-size: 9pt; font-weight: bold; color: #334155;">Estado emocional observado:</p>
                <div style="padding: 10px; background: #fdfdfd; border-bottom: 1px solid #e2e8f0; font-size: 9pt; white-space: pre-wrap; min-height: 40px;">${val('sf_emocional')}</div>
            </div>
            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 5px 0; font-size: 9pt; font-weight: bold; color: #334155;">Preocupaciones principales:</p>
                <div style="padding: 10px; background: #fdfdfd; border-bottom: 1px solid #e2e8f0; font-size: 9pt; white-space: pre-wrap; min-height: 40px;">${val('sf_preoc')}</div>
            </div>
            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 5px 0; font-size: 9pt; font-weight: bold; color: #334155;">Pérdidas detectadas:</p>
                <div style="padding: 10px; background: #fdfdfd; border-bottom: 1px solid #e2e8f0; font-size: 9pt; white-space: pre-wrap; min-height: 40px;">${val('sf_perdidas')}</div>
            </div>
            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 5px 0; font-size: 9pt; font-weight: bold; color: #334155;">Recursos psicológicos:</p>
                <div style="padding: 10px; background: #fdfdfd; border-bottom: 1px solid #e2e8f0; font-size: 9pt; white-space: pre-wrap; min-height: 40px;">${val('sf_recursos')}</div>
            </div>
            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 5px 0; font-size: 9pt; font-weight: bold; color: #334155;">Diagnóstico funcional:</p>
                <div style="padding: 10px; background: #fdfdfd; border-bottom: 1px solid #e2e8f0; font-size: 9pt; white-space: pre-wrap; min-height: 40px;">${val('sf_diagnostico')}</div>
            </div>
        </div>
    `;

    // --- RESUMEN FINAL Y OBJETIVOS ---
    html += `
        <div style="margin-bottom: 40px; page-break-inside: avoid; display: flex; gap: 20px;">
            <div style="flex: 1; border: 1px solid #cbd5e1;">
                <h3 style="background: #f1f5f9; margin: 0; padding: 10px; font-size: 10pt; font-weight: bold; border-bottom: 1px solid #cbd5e1; text-align: center;">RESUMEN ESCALAS</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
                    <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; width: 50%;">Yesavage:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${ys_interp} (${ys_total})</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">GAI:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${gai_interp} (${gai_total})</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Soledad:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${val('rf_soledad')}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Autonomía:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${val('rf_autonomia')}</td></tr>
                    <tr><td style="padding: 8px; font-weight: bold;">Riesgo:</td><td style="padding: 8px;">${val('rf_riesgo')}</td></tr>
                </table>
            </div>
            
            <div style="flex: 1; border: 1px solid #cbd5e1;">
                <h3 style="background: #f1f5f9; margin: 0; padding: 10px; font-size: 10pt; font-weight: bold; border-bottom: 1px solid #cbd5e1; text-align: center;">OBJETIVOS TERAPÉUTICOS</h3>
                <div style="padding: 15px; font-size: 9pt;">
    `;
    const objOpts = ['Historia de vida', 'Reestructuración cognitiva', 'Manejo ansiedad', 'Red apoyo', 'Duelo', 'Sentido vida', 'Otro'];
    objOpts.forEach(opt => {
        html += `<div style="margin-bottom: 8px;">${isChecked('obj_terap', opt) ? '☑' : '☐'} ${opt}</div>`;
    });
    html += `
                    <div style="margin-top: 10px; color: #64748b;">(Otro: ${val('obj_otro')})</div>
                </div>
            </div>
        </div>
    `;

    // --- COORDINACIÓN CON TO ---
    html += `
        <div style="margin-bottom: 40px; page-break-inside: avoid;">
            <h3 style="background: #f8fafc !important; color: #0f172a !important; border-left: 5px solid #0f172a; padding: 10px 15px; margin-bottom: 15px; font-size: 11pt; font-weight: bold;">COORDINACIÓN CON TERAPIA OCUPACIONAL</h3>
            <div style="padding: 10px; background: #fdfdfd; border: 1px solid #e2e8f0; font-size: 9pt; white-space: pre-wrap; min-height: 40px;">${val('coord_to')}</div>
        </div>
    `;

    container.innerHTML = html;

    // --- BLOQUE DE FIRMA - ELIMINADO para evaluaciones iniciales ---
    if (signatureArea) {
        signatureArea.innerHTML = '';
    }

    // Ejecutar impresión
    setActivePrintContainer('formulario-imprimible');
    setTimeout(() => {
        window.print();
    }, 500);
}

function renderDocToPrintContainer(doc, paciente, config) {
    const container = document.getElementById('prTestContent');
    const signatureArea = document.getElementById('dynamicSignatureArea');
    const data = doc.rawData || {};

    container.innerHTML = '';
    if (signatureArea) signatureArea.innerHTML = '';

    // CASO ESPECIAL: Evaluación Psicológica Inicial
    if (doc.titulo === 'Evaluación Psicológica Inicial') {
        if (typeof renderEvalPsicologicaPrint === 'function') {
            renderEvalPsicologicaPrint(doc, paciente);
            return;
        }
    }

    if (!config) {
        renderBasicPrint(doc, paciente);
        return;
    }

    // 1. Cabecera del Informe
    document.getElementById('prTestMainTitle').textContent = doc.titulo.toUpperCase();
    document.getElementById('prTestNombre').textContent = paciente.nombre || '---';
    document.getElementById('prTestRut').textContent = paciente.rut || '---';
    document.getElementById('prTestEdad').textContent = (paciente.edad || '-') + ' años';
    document.getElementById('prTestFecha').textContent = doc.fecha || new Date().toLocaleDateString('es-CL');
    document.getElementById('prTestDir').textContent = paciente.domicilio || '---';
    document.getElementById('prTestProf').textContent = doc.profesional || '---';

    // 1b. Si es Lawton: preparar datos (la renderización ahora es en el cuerpo del informe)
    const isLawton = doc.titulo.toLowerCase().includes('lawton');
    const lawtonSexo = data['lb_sexo'] || '';
    const lawtonSexoLabel = lawtonSexo === 'hombre' ? 'Hombre ♂' : lawtonSexo === 'mujer' ? 'Mujer ♀' : 'No registrado';

    // 2. Renderizar Secciones
    let html = '';
    let totalScore = 0;
    const resultTypes = ['total-score', 'dashboard-score', 'depression-result', 'suggested-classification', 'anxiety-result', 'barthel-result', 'mmse-result'];
    const sections = config.sections || [{ title: config.title, fields: config.fields || [] }];

    sections.forEach((section, sIdx) => {
        const isScale = section.fields.some(f => ['scored-yesno', 'scored-number', 'mmse-row', 'hamilton-row', 'scored-option-list'].includes(f.type));

        // Reducir margen inferior y permitir saltos internos si la sección es muy grande
        html += `
            <div class="print-section" style="margin-bottom: 10px; page-break-inside: auto;">
                <h3 style="background: #f1f5f9 !important; color: #1e3a8a !important; border-left: 5px solid #1e3a8a; padding: 6px 12px; margin-bottom: 8px; font-size: 11pt; text-transform: uppercase;">
                    ${sIdx + 1}. ${section.title}
                </h3>
        `;

        if (isScale) {
            html += `
                <table class="print-table-compact" style="width: 100%; border-collapse: collapse; margin-bottom: 8px; border: 1px solid #e2e8f0; page-break-inside: auto;">
                    <thead>
                        <tr style="background: #f8fafc;">
                            <th style="text-align: left; padding: 8px; border: 1px solid #e2e8f0; font-size: 9pt; color: #475569;">Pregunta / Ítem</th>
                            <th style="text-align: center; padding: 8px; border: 1px solid #e2e8f0; width: 120px; font-size: 9pt; color: #475569;">Respuesta</th>
                            <th style="text-align: center; padding: 8px; border: 1px solid #e2e8f0; width: 80px; font-size: 9pt; color: #475569;">Puntaje</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            section.fields.forEach(field => {
                if (resultTypes.includes(field.type) || field.type === 'info-block' || field.type === 'info-text') return;
                // Ignorar sex-selector e interpretation-guide en el cuerpo de la tabla (ya se muestran arriba)
                if (field.type === 'sex-selector' || field.type === 'interpretation-guide') return;

                let val = data[field.id] !== undefined ? data[field.id] : '---';
                let score = 0;
                let displayVal = val;

                // Formatear si es objeto (radio-grid) o array (checkbox)
                if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                    displayVal = Object.entries(val).map(([k, v]) => `${k}: ${v || '---'}`).join('\n');
                } else if (Array.isArray(val)) {
                    displayVal = val.join(', ');
                }

                if (field.type === 'scored-yesno') {
                    const isYes = val === 'Sí';
                    const yS = field.yesScore !== undefined ? field.yesScore : (field.scoreIfYes ? 1 : 0);
                    const nS = field.noScore !== undefined ? field.noScore : (field.scoreIfYes ? 0 : 1);
                    score = isYes ? yS : nS;
                } else if (field.type === 'mmse-row') {
                    if (val && typeof val === 'object' && val.score !== undefined) {
                        score = parseInt(val.score) || 0;
                        displayVal = val.text || '---';
                    } else {
                        score = parseInt(val) || 0;
                        displayVal = '---';
                    }
                } else if (field.type === 'scored-number') {
                    score = parseInt(val) || 0;
                } else if (field.type === 'hamilton-row') {
                    score = parseInt(val) || 0;
                    const labels = ['Ausente', 'Leve', 'Moderado', 'Grave', 'Muy grave'];
                    displayVal = labels[score] || val;
                } else if (field.type === 'scored-option-list') {
                    const opt = field.options ? field.options.find(o => o.text === val) : null;
                    score = opt ? opt.score : 0;
                } else {
                    return;
                }

                totalScore += score;
                html += `
                    <tr>
                        <td style="padding: 8px; border: 1px solid #e2e8f0; font-size: 9pt; color: #1e293b;">${field.label}</td>
                        <td style="padding: 8px; border: 1px solid #e2e8f0; font-size: 9pt; text-align: center; color: #334155;">${displayVal}</td>
                        <td style="padding: 8px; border: 1px solid #e2e8f0; font-size: 9pt; text-align: center; font-weight: bold; color: #1e3a8a;">${score}</td>
                    </tr>
                `;
            });

            html += `</tbody></table>`;

            section.fields.forEach(field => {
                if (field.type === 'textarea') {
                    let val = data[field.id] !== undefined ? data[field.id] : '---';
                    if (Array.isArray(val)) val = val.join(', ');
                    html += `
                        <div style="margin-bottom: 8px; page-break-inside: avoid;">
                            <p style="margin: 0 0 2px 0; font-size: 9pt; font-weight: bold; color: #334155;">${field.label}</p>
                            <div style="padding: 8px 12px; background: #f8fafc; border-left: 3px solid #cbd5e1; font-size: 9pt; color: #1e293b; white-space: pre-wrap;">${val}</div>
                        </div>
                    `;
                }
            });
        } else {
            section.fields.forEach(field => {
                if (resultTypes.includes(field.type) || field.type === 'info-block' || field.type === 'info-text') return;
                let val = data[field.id] !== undefined ? data[field.id] : '---';

                if (field.type === 'sex-selector') {
                    const label = val === 'hombre' ? 'Hombre' : val === 'mujer' ? 'Mujer' : 'No registrado';
                    html += `
                        <div style="margin-bottom: 15px; padding: 12px 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                            <p style="margin: 0; font-size: 10pt; color: #1e293b;"><strong>Sexo:</strong> ${label}</p>
                        </div>
                    `;
                    return;
                }

                if (field.type === 'interpretation-guide') {
                    const isHombre = data['lb_sexo'] === 'hombre';
                    const maxPts = isHombre ? 5 : 8;
                    const guideRows = isHombre ? [
                        ['5 pts', 'Autónomo / Independiente'],
                        ['4 pts', 'Dependencia leve'],
                        ['3 pts', 'Dependencia ligera'],
                        ['2 pts', 'Dependencia moderada'],
                        ['1 pt', 'Dependencia grave'],
                        ['0 pts', 'Dependencia total']
                    ] : [
                        ['8 pts', 'Autónoma / Independiente'],
                        ['6–7 pts', 'Dependencia ligera'],
                        ['4–5 pts', 'Dependencia moderada'],
                        ['2–3 pts', 'Dependencia grave'],
                        ['0–1 pts', 'Dependencia total']
                    ];

                    html += `
                        <div style="margin-bottom: 20px;">
                            <p style="margin: 0 0 10px 0; font-size: 10pt; font-weight: bold; color: #1e3a8a;">Guía de interpretación (máx. ${maxPts} pts):</p>
                            <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; font-size: 9pt;">
                                <thead>
                                    <tr style="background: #f8fafc;">
                                        <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: center; width: 100px; color: #475569;">Puntaje</th>
                                        <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left; color: #475569;">Interpretación</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${guideRows.map(r => `
                                        <tr>
                                            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #1e3a8a;">${r[0]}</td>
                                            <td style="padding: 8px; border: 1px solid #e2e8f0; color: #334155;">${r[1]}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                            <p style="margin: 8px 0 0 0; font-size: 8.5pt; color: #64748b; font-style: italic;">
                                ${isHombre
                            ? '* Hombre: 5 dominios (teléfono, compras, transporte, medicación, economía).'
                            : '* Mujer: 8 dominios (incluye comida, hogar y lavado de ropa).'}
                            </p>
                        </div>
                    `;
                    return;
                }

                // Formatear si es objeto (radio-grid) o array (checkbox)
                let displayVal = val;
                if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                    displayVal = Object.entries(val)
                        .map(([k, v]) => `${k}: ${v || '---'}`)
                        .join('\n');
                } else if (Array.isArray(val)) {
                    displayVal = val.join(', ');
                }

                html += `
                    <div style="margin-bottom: 8px; page-break-inside: avoid;">
                        <p style="margin: 0 0 2px 0; font-size: 9pt; font-weight: bold; color: #334155;">${field.label}</p>
                        <div style="padding: 6px 10px; background: #f8fafc; border-left: 3px solid #cbd5e1; font-size: 9pt; color: #1e293b; white-space: pre-wrap;">${displayVal}</div>
                    </div>
                `;
            });
        }
        html += `</div>`;
    });

    // 3. Interpretación Automática
    let interpretation = "";
    const testTitle = doc.titulo.toLowerCase();

    if (testTitle.includes('yesavage')) {
        if (totalScore <= 4) interpretation = "Normal (Depresión improbable)";
        else if (totalScore <= 9) interpretation = "Depresión leve (Sugerir evaluación)";
        else interpretation = "Depresión moderada/severa (Derivar)";
    } else if (testTitle.includes('barthel')) {
        if (totalScore >= 100) interpretation = "Independiente";
        else if (totalScore >= 91) interpretation = "Dependencia leve";
        else if (totalScore >= 61) interpretation = "Dependencia moderada";
        else if (totalScore >= 21) interpretation = "Dependencia severa";
        else interpretation = "Dependencia total";
    } else if (testTitle.includes('lawton')) {
        if (lawtonSexo === 'hombre') {
            // Escala masculina: máximo 5 dominios
            if (totalScore <= 0) interpretation = "Dependencia total";
            else if (totalScore <= 1) interpretation = "Dependencia grave";
            else if (totalScore <= 2) interpretation = "Dependencia moderada";
            else if (totalScore <= 3) interpretation = "Dependencia ligera";
            else if (totalScore <= 4) interpretation = "Dependencia leve";
            else interpretation = "Autónomo / Independiente";
        } else {
            // Escala femenina: máximo 8 dominios (o sin sexo = genérico)
            if (totalScore <= 1) interpretation = "Dependencia total";
            else if (totalScore <= 3) interpretation = "Dependencia grave";
            else if (totalScore <= 5) interpretation = "Dependencia moderada";
            else if (totalScore <= 7) interpretation = "Dependencia ligera";
            else interpretation = "Autónoma / Independiente";
        }
    } else if (testTitle.includes('mmse')) {
        if (totalScore >= 27) interpretation = "Normal";
        else if (totalScore >= 24) interpretation = "Deterioro cognitivo leve / Sospecha";
        else if (totalScore >= 12) interpretation = "Deterioro cognitivo moderado";
        else interpretation = "Deterioro cognitivo severo / Demencia";
    } else if (testTitle.includes('hamilton')) {
        if (totalScore <= 17) interpretation = "Ansiedad leve";
        else if (totalScore <= 24) interpretation = "Ansiedad moderada";
        else if (totalScore <= 30) interpretation = "Ansiedad grave";
        else interpretation = "Ansiedad muy grave";
    }

    // 3b. No mostrar bloque de puntaje si es el Test de TO (no es una escala cuantitativa)
    if (!testTitle.includes('terapia ocupacional')) {
        html += `
            <div style="margin-top: 30px; padding: 20px; background: #eff6ff; border: 2px solid #1e3a8a; border-radius: 12px; page-break-inside: avoid;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 11pt; font-weight: bold; color: #1e3a8a;">PUNTAJE TOTAL:</span>
                    <span style="font-size: 18pt; font-weight: 800; color: #1e3a8a;">${totalScore}</span>
                </div>
                ${interpretation ? `
                <div style="border-top: 1px solid #bfdbfe; padding-top: 10px;">
                    <span style="font-size: 10pt; font-weight: bold; color: #1e3a8a;">INTERPRETACIÓN SUGERIDA:</span>
                    <p style="margin: 5px 0 0 0; font-size: 11pt; color: #1e293b; font-weight: 600;">${interpretation}</p>
                </div>` : ''}
            </div>
        `;
    }

    container.innerHTML = html;

    // 4. Bloque de Firmas - ELIMINADO para formularios/encuestas según requerimiento
    if (signatureArea) {
        signatureArea.innerHTML = '';
    }

    setActivePrintContainer('formulario-imprimible');
    setTimeout(() => { window.print(); }, 500);
}

function renderBasicPrint(doc, p) {
    document.getElementById('prTestMainTitle').textContent = doc.titulo.toUpperCase();
    document.getElementById('prTestNombre').textContent = p.nombre;
    document.getElementById('prTestRut').textContent = p.rut;
    document.getElementById('prTestEdad').textContent = p.edad + ' años';
    document.getElementById('prTestFecha').textContent = doc.fecha;
    document.getElementById('prTestProf').textContent = doc.profesional || '---';

    const container = document.getElementById('prTestContent');
    container.innerHTML = `
        <div class="print-test-section">
            <h3 class="cto-print-header" style="background: #f1f5f9 !important; color: #1e3a8a !important; border-left: 5px solid #1e3a8a; padding: 8px 15px; margin-bottom: 15px; font-size: 11pt;">RESUMEN DE EVALUACIÓN</h3>
            <div style="padding: 15px; border: 1px solid #eee; border-radius: 8px; font-size: 10pt; line-height: 1.6; white-space: pre-wrap;">
                ${doc.contenido}
            </div>
        </div>
    `;

    setActivePrintContainer('formulario-imprimible');

    setTimeout(() => { window.print(); }, 300);
}

function reprintArticulo(artId) {
    const p = patients.find(x => x.id === currentPatientId);
    const art = p.entregas.find(d => d.id === artId);
    if (!art) return;

    if (!art.firmaProf || art.firmaProf.length < 500) {
        if (!confirm("⚠️ El comprobante se imprimirá sin firma del profesional. ¿Desea continuar?")) {
            return;
        }
    }

    prepareArticuloPrint(art, p);

    setTimeout(() => {
        window.print();
    }, 500);
}

function printUltimaEntrega() {
    const p = patients.find(x => x.id === currentPatientId);
    if (!p || !p.entregas || p.entregas.length === 0) {
        alert("No hay entregas registradas para imprimir.");
        return;
    }
    const ultima = p.entregas[0];

    if (!ultima.firmaProf || ultima.firmaProf.length < 500) {
        if (!confirm("⚠️ El comprobante se imprimirá sin firma del profesional. ¿Desea continuar?")) {
            return;
        }
    }

    prepareArticuloPrint(ultima, p);
    setTimeout(() => {
        window.print();
    }, 500);
}

// Inicializar sistema
renderTable();

async function subirImagenStorage(archivo) {
  if (!archivo) return null;
  const extension = archivo.name.split('.').pop();
  const nombreArchivo = `${Date.now()}_entrega.${extension}`;

  const { error } = await supabase.storage
    .from('archivos')
    .upload(nombreArchivo, archivo);

  if (error) {
    console.error("Error al subir archivo:", error);
    return null;
  }

  const { data } = supabase.storage.from('archivos').getPublicUrl(nombreArchivo);
  return data.publicUrl;

async function cargarTablaEntregas() {
  const tbody = document.getElementById('tablaEntregasBody');
  if (!tbody) return;

  const { data: entregas, error } = await supabase
    .from('entregas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return console.error(error);

  tbody.innerHTML = entregas.map(item => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 10px;">${item.fecha || '-'}</td>
      <td style="padding: 10px;">${item.profesional || '-'}</td>
      <td style="padding: 10px;">
        ${item.imagen_url 
          ? `<a href="${item.imagen_url}" target="_blank" style="color: #6366f1; font-weight: 600;">🖼️ Ver Foto</a>` 
          : '<span style="color:#aaa;">Sin foto</span>'}
      </td>
      <td style="padding: 10px; text-align: center;">
        <button onclick="eliminarEntrega('${item.id}')" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">
          🗑️ Borrar
        </button>
      </td>
    </tr>
  `).join('');
}

async function eliminarEntrega(idEntrega) {
  if (!confirm("¿Deseas eliminar esta entrega mal registrada?")) return;

  const { error } = await supabase
    .from('entregas')
    .delete()
    .eq('id', idEntrega);

  if (error) {
    alert("Error al eliminar la entrega: " + error.message);
  } else {
    alert("Entrega eliminada correctamente");
    cargarTablaEntregas(); // Refresca la tabla
  }
}

window.imprimirHistorialCompletoEvaluaciones = async function() {
  const p = patients.find(x => x.id === currentPatientId);
  if (!p) return alert("Por favor, selecciona un paciente primero.");

  const { data: historial, error } = await db
    .from('documentos')
    .select('*')
    .eq('paciente_id', p.id)
    .order('created_at', { ascending: false });

  if (error || !historial || historial.length === 0) {
    return alert("No hay evaluaciones guardadas en Supabase para este paciente.");
  }

  const container = document.getElementById('prTestContent');
  if (!container) return alert("No se encontró el contenedor #prTestContent.");

  let html = '<div style="font-family: Arial, sans-serif; color: #000;">';

  historial.forEach(function(doc, index) {
    const fecha = doc.fecha || doc.fecha_guardado || 'Sin fecha';
    const estadoText = doc.estado === 'borrador' ? ' (Borrador)' : '';
    const titulo = doc.titulo || 'EVALUACIÓN / FORMULARIO';
    const contenido = doc.contenido || 'Sin contenido registrado.';
    const numVersion = historial.length - index;

    html += '<div style="page-break-after: always; break-after: page; padding: 20px 0;">';
    html += '  <div style="border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 20px; text-align: center;">';
    html += '    <h2 style="margin: 0; color: #1e3a8a; text-transform: uppercase; font-size: 14pt;">' + titulo + estadoText + '</h2>';
    html += '    <p style="margin: 5px 0 0 0; font-size: 10pt; color: #333;">';
    html += '      <strong>Versión #' + numVersion + '</strong> | ';
    html += '      <strong>Paciente:</strong> ' + p.nombre + ' | ';
    html += '      <strong>RUT:</strong> ' + (p.rut || 'N/A') + ' | ';
    html += '      <strong>Fecha Guardado:</strong> ' + fecha;
    html += '    </p>';
    html += '  </div>';
    html += '  <div style="font-size: 10pt; line-height: 1.5; color: #1e293b; white-space: pre-wrap; min-height: 400px;">' + contenido + '</div>';

    if (doc.profesional) {
      html += '  <div style="margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px; text-align: right; font-size: 9pt; color: #475569;">';
      html += '    <strong>Profesional a cargo:</strong> ' + doc.profesional;
      html += '  </div>';
    }

    html += '</div>';
  });

  html += '</div>';

  container.innerHTML = html;
  setActivePrintContainer('formulario-imprimible');

  setTimeout(function() {
    window.print();
  }, 300);
};
