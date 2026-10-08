/* Conteúdo do atelier: serviços, horário e avaliações.
   Fonte: perfil Fresha (Beethoven, Porto) e site pessoal do Beethoven. */
window.BTV = {
  business: {
    name: 'Beethoven',
    atelier: 'LABOR B · Beethoven Atelier',
    street: 'Rua Académico Futebol Club 191',
    city: '4200-602 Porto',
    mapsUrl: 'https://maps.google.com/?daddr=Rua%20Acad%C3%A9mico%20Futebol%20Club%20191%2C%20Porto%2C%204200-602',
    phone: '+351 915 500 180',
    phoneHref: 'tel:+351915500180',
    whatsapp: 'https://wa.me/351915500180',
    email: 'btvnmedeiros@gmail.com',
    instagram: 'https://instagram.com/btoven',
    rating: '5,0',
    reviews: 10,
  },

  // 0 = domingo … 6 = sábado · minutos desde a meia-noite · null = fechado
  hours: {
    0: null,
    1: [14 * 60, 20 * 60 + 30],
    2: [11 * 60, 20 * 60 + 30],
    3: [11 * 60, 20 * 60 + 30],
    4: [11 * 60, 20 * 60 + 30],
    5: [11 * 60, 20 * 60 + 30],
    6: [10 * 60, 16 * 60],
  },

  categories: [
    { id: 'destaque', label: 'Em destaque' },
    { id: 'balayage', label: 'Balayage' },
    { id: 'cor', label: 'Cor' },
    { id: 'corte', label: 'Corte & styling' },
    { id: 'tratamentos', label: 'Tratamentos' },
    { id: 'consultoria', label: 'Consultoria' },
  ],

  services: [
    {
      id: 'balayage', cat: 'balayage', featured: true,
      name: 'Balayage · Técnica Francesa', dur: 210, price: 140, from: true,
      short: 'O desenho de luz completo, da análise ao styling.',
      img: '/beethoven/assets/img/work-03.webp',
      includes: [
        'Análise de visagismo profissional',
        'Primer Olaplex e Metal Detox pré-química',
        'Desenho com a técnica francesa original de balayage',
        'Estabilização dos fios',
        'Gloss e tonalização',
        'Tratamento pós-química: reposição lipídica e queratina',
        'Tratamento com tecnologia infravermelha',
        'Styling',
        'Prescrição personalizada de produtos para casa',
        'Acesso à IA capilar do Beethoven',
      ],
    },
    {
      id: 'manutencao', cat: 'balayage', featured: true,
      name: 'Manutenção · Balayage Francesa', dur: 180, price: 120, from: true,
      short: 'Para quem fez balayage no atelier há menos de 6 meses.',
      img: '/beethoven/assets/img/work-02.webp',
      includes: [
        'Nova análise de visagismo',
        'Re-design da balayage com técnica francesa',
        'Tratamento pós-química: reposição lipídica e queratina',
        'Tratamento com tecnologia infravermelha',
        'Styling',
        'Prescrição personalizada de produtos para casa',
        'Acesso à IA capilar do Beethoven',
      ],
    },
    {
      id: 'faceframing', cat: 'balayage',
      name: 'Design de Contornos · Face Framing', dur: 120, price: 70, from: false,
      short: 'Luz pensada para a moldura do rosto e o topo.',
      img: '/beethoven/assets/img/people-10.webp',
      includes: [
        'Design de iluminação e cor na frente do rosto e no topo',
        'Primer de proteção Olaplex e Metal Detox',
        'Gloss e tonalização',
        'Tratamento de nutrição',
        'Styling',
      ],
    },
    {
      id: 'correcao', cat: 'cor', featured: true,
      name: 'Correção de Cor', dur: 330, price: 170, from: true,
      short: 'Recuperar o tom certo depois de uma má experiência.',
      img: '/beethoven/assets/img/work-09.webp',
      includes: [
        'Análise de visagismo',
        'Correção de cor',
        'Novo design e acabamentos',
        'Estabilização dos fios',
        'Tonalização',
        'Tratamento pós-química com reposição lipídica e queratina',
        'Styling',
        'Prescrição personalizada de produtos para casa',
      ],
    },
    {
      id: 'gloss', cat: 'cor', featured: true,
      name: 'Gloss & Tonalização', dur: 90, price: 60, from: true,
      short: 'O “banho de cor” que refresca o tom e devolve o brilho.',
      img: '/beethoven/assets/img/work-06.webp',
      includes: [
        'Tonalização com Redken Shades EQ ou Igora Vibrance',
        'Brushing oferecido (ondas: +5 €)',
      ],
    },
    {
      id: 'coloracao', cat: 'cor',
      name: 'Coloração · Raiz ou Global', dur: 120, price: 50, from: true,
      short: 'Cobertura de brancos com coloração de alta performance.',
      img: '/beethoven/assets/img/people-04.webp',
      includes: [
        'Coloração de fios brancos com certificação PETA',
        'Tratamento de nutrição com infravermelhos',
        'Styling',
        '+10 € para cabelos densos ou longos',
      ],
    },
    {
      id: 'corte', cat: 'corte',
      name: 'Corte de Cabelo', dur: 90, price: 50, from: true,
      short: 'Corte com lavagem, hidratação e brushing.',
      img: '/beethoven/assets/img/people-21.webp',
      includes: ['Shampoo e hidratação', 'Corte personalizado', 'Brushing e produtos de styling'],
    },
    {
      id: 'corteextra', cat: 'corte', addon: true,
      name: 'Corte Extra', dur: 35, price: 30, from: false,
      short: 'Só em conjunto com outro serviço.',
      img: '/beethoven/assets/img/people-16.webp',
      includes: ['Junta-se a Balayage, Manutenção, Boticário Capilar, Coloração, Tratamento Intensivo ou Alinhamento dos Fios'],
    },
    {
      id: 'styling', cat: 'corte',
      name: 'Styling', dur: 60, price: 30, from: true,
      short: 'Lavagem, brushing e styling para um dia especial.',
      img: '/beethoven/assets/img/people-19.webp',
      includes: ['Shampoo e condicionador', 'Brushing e styling', '+10 € para cabelos longos ou densos', 'Penteados: valor sob consulta'],
    },
    {
      id: 'boticario', cat: 'tratamentos',
      name: 'Boticário Capilar', dur: 60, price: 40, from: false,
      short: 'Força, nutrição e brilho num só ritual.',
      img: '/beethoven/assets/img/people-15.webp',
      includes: [
        'Carga de proteína e queratina',
        'Reposição de vitaminas e aminoácidos',
        'Tratamento com infravermelhos',
        'Infusão de óleos para nutrição e brilho',
        'Desintoxicação do couro cabeludo',
        'Secagem e brushing oferecidos',
      ],
    },
    {
      id: 'intensivo', cat: 'tratamentos',
      name: 'Tratamento Intensivo · Truss, Hoka, Oribe ou Olaplex', dur: 60, price: 40, from: false,
      short: 'Reconstrução profunda, ideal a seguir à cor.',
      img: '/beethoven/assets/img/people-13.webp',
      includes: [
        'Shampoo No Metal: remove calcário, chumbo e ferro',
        'Fluido reconstrutor de força',
        'Proteína, queratina e aminoácidos',
        'Bálsamo de nutrição intensiva',
      ],
    },
    {
      id: 'alinhamento', cat: 'tratamentos',
      name: 'Alinhamento dos Fios', dur: 120, price: 90, from: true,
      short: 'Menos frizz e volume, sem perder a textura.',
      img: '/beethoven/assets/img/people-24.webp',
      includes: ['Reduz volume e frizz', 'Fios alinhados, nutridos e brilhantes', 'Dura cerca de 2 meses', 'Não é alisamento nem botox'],
    },
    {
      id: 'consultoria', cat: 'consultoria',
      name: 'Consultoria de Imagem e Visagismo', dur: 60, price: 40, from: false,
      short: 'Análise de visagismo e teste de mecha.',
      img: '/beethoven/assets/img/beethoven-portrait.webp',
      includes: [
        'Análise de visagismo para definir as melhores opções',
        'Teste de mecha: saúde do fio, reação e alergias',
        'Valor descontado se avançar com um serviço de cor',
      ],
    },
  ],

  reviews: [
    {
      name: 'Joana S.', initials: 'JS',
      service: 'Balayage · Técnica Francesa', date: 'setembro 2025',
      text: 'Uma palavra apenas: incrível! O único profissional a quem confio plenamente o meu cabelo.',
    },
    {
      name: 'Fanny F.', initials: 'FF',
      service: 'Correção de Cor', date: 'agosto 2025', translated: true,
      text: 'Obrigada, salvaste literalmente o meu cabelo! Estou tão grata por voltar a ter uma balayage a sério depois do desastre que vivi com outro cabeleireiro. Fizeste magia.',
    },
    {
      name: 'Yumna O.', initials: 'YO',
      service: 'Coloração · Raiz ou Global', date: 'agosto 2025',
      text: 'O Beethoven é um verdadeiro artista. Muito pela dedicação.',
    },
  ],
};

/* Utilitários partilhados */
window.BTVfmt = {
  eur(v, decimals) {
    const d = decimals != null ? decimals : (Number.isInteger(v) ? 0 : 2);
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
  },
  dur(min) {
    const h = Math.floor(min / 60), m = min % 60;
    if (!h) return m + ' min';
    return m ? `${h} h ${m} min` : `${h} h`;
  },
  hhmm(min) {
    return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0');
  },
};
