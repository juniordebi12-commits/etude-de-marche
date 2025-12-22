// src/data/templatesData.js
// Liste de modèles + presets complets pour Editor (questions incluses)

export const TEMPLATES = [
  {
    id: "satisfaction-client",
    title: "Satisfaction Client",
    description:
      "Évaluez la satisfaction de vos clients et identifiez les axes d’amélioration.",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4",
    category: "Satisfaction",
  },
  {
    id: "nps",
    title: "Net Promoter Score (NPS)",
    description: "Mesurez la fidélité de vos clients avec l’indicateur NPS.",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    category: "Satisfaction",
  },
  {
    id: "feedback-service-client",
    title: "Feedback Service Client",
    description:
      "Mesurez la performance de votre support et détectez les points faibles.",
    image: "https://images.unsplash.com/photo-1492724441997-5dc865305da7",
    category: "Support",
  },

  // 10 nouveaux modèles
  {
    id: "etude-de-marche",
    title: "Étude de Marché",
    description:
      "Analysez les besoins du marché, les segments de clients et les attentes.",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40",
    category: "Marketing",
  },
  {
    id: "rh-climat-social",
    title: "Climat Social (RH)",
    description:
      "Évaluez le bien-être, la motivation et les conditions de travail du personnel.",
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d",
    category: "RH",
  },
  {
    id: "evaluation-formation",
    title: "Évaluation de Formation",
    description:
      "Mesurez l'impact, la qualité et l'amélioration souhaitée d’une formation.",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b",
    category: "Formation",
  },
  {
    id: "inscription-evenement",
    title: "Inscription à un Événement",
    description:
      "Collectez les informations essentielles pour organiser votre événement.",
    image: "https://images.unsplash.com/photo-1503428593586-e225b39bddfe",
    category: "Événement",
  },
  {
    id: "suivi-terrain",
    title: "Suivi Terrain",
    description:
      "Standardisez la prise d'informations sur le terrain pour vos équipes.",
    image: "https://images.unsplash.com/photo-1484820540004-14229fe36ca4",
    category: "Terrain",
  },
  {
    id: "satisfaction-employes",
    title: "Satisfaction Employés",
    description:
      "Mesurez l’engagement, la motivation et le moral de vos employés.",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c",
    category: "RH",
  },
  {
    id: "avis-produit",
    title: "Avis Produit",
    description: "Collectez des retours clients précis sur l’utilisation d’un produit.",
    image: "https://images.unsplash.com/photo-1581090700227-1e37b190418e",
    category: "Produit",
  },
  {
    id: "demande-support",
    title: "Demande de Support",
    description: "Centralisez les demandes internes et optimisez le suivi.",
    image: "https://images.unsplash.com/photo-1521791055366-0d553872125f",
    category: "Support",
  },
  {
    id: "formulaire-contact",
    title: "Formulaire de Contact",
    description:
      "Permettez à vos clients de vous contacter avec toutes les infos utiles.",
    image: "https://images.unsplash.com/photo-1519241047957-be31d7379a5d",
    category: "Général",
  },
  {
    id: "evaluation-commerciale",
    title: "Évaluation Commerciale",
    description:
      "Suivez la qualité de vos points de vente ou de vos équipes commerciales.",
    image: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df",
    category: "Ventes",
  },
];

// PRESETS — utilisé par l'Editor pour préremplir titres, description, image et questions.
// Pour les 10 nouveaux modèles on ajoute 10 questions de style professionnel (variations text/single/multiple/number)
export const PRESETS = {
  "satisfaction-client": {
    ...TEMPLATES.find(t => t.id === "satisfaction-client"),
    questions: [
      { text: "Comment évaluez-vous votre satisfaction globale ?", question_type: "single", choices: [{ text: "Très satisfait" }, { text: "Satisfait" }, { text: "Neutre" }, { text: "Insatisfait" }, { text: "Très insatisfait" }] },
      { text: "Qu'avez-vous le plus apprécié ?", question_type: "text", choices: [] },
      { text: "Qu'est-ce qui pourrait être amélioré ?", question_type: "text", choices: [] },
      { text: "La qualité perçue de nos produits/services", question_type: "single", choices: [{ text: "Excellente" }, { text: "Bonne" }, { text: "Moyenne" }, { text: "Faible" }] },
      { text: "Le rapport qualité/prix est-il satisfaisant ?", question_type: "single", choices: [{ text: "Oui" }, { text: "Non" }] },
      { text: "Fréquence d'utilisation de nos produits/services", question_type: "single", choices: [{ text: "Quotidiennement" }, { text: "Hebdomadairement" }, { text: "Mensuellement" }, { text: "Rarement" }] },
      { text: "Comment avez-vous connu notre entreprise ?", question_type: "multiple", choices: [{ text: "Bouche-à-oreille" }, { text: "Réseaux sociaux" }, { text: "Publicité" }, { text: "Recherche web" }] },
      { text: "Recommanderiez-vous notre entreprise ?", question_type: "single", choices: [{ text: "Oui" }, { text: "Non" }] },
      { text: "Notez votre satisfaction sur 10", question_type: "number", choices: [] },
      { text: "Commentaires supplémentaires", question_type: "text", choices: [] },
    ],
  },

  nps: {
    ...TEMPLATES.find(t => t.id === "nps"),
    questions: [
      { text: "Sur une échelle de 0 à 10, quelle probabilité de recommander ?", question_type: "number", choices: [] },
      { text: "Qu'est-ce qui motive votre note ?", question_type: "text", choices: [] },
      { text: "Type de client", question_type: "single", choices: [{ text: "Particulier" }, { text: "Professionnel" }] },
      { text: "Canal principal d'achat / contact", question_type: "single", choices: [{ text: "Magasin" }, { text: "En ligne" }, { text: "Partenaire" }] },
      { text: "Quels aspects appréciez-vous le plus ?", question_type: "multiple", choices: [{ text: "Prix" }, { text: "Qualité" }, { text: "Service" }, { text: "Livraison" }] },
      { text: "Depuis combien de temps êtes-vous client ?", question_type: "single", choices: [{ text: "Moins de 6 mois" }, { text: "6-12 mois" }, { text: "1-3 ans" }, { text: ">3 ans" }] },
      { text: "Avez-vous déjà recommandé ?", question_type: "single", choices: [{ text: "Oui" }, { text: "Non" }] },
      { text: "Si non, pourquoi ?", question_type: "text", choices: [] },
      { text: "Amélioration prioritaire selon vous ?", question_type: "text", choices: [] },
      { text: "Commentaires additionnels", question_type: "text", choices: [] },
    ],
  },

  "feedback-service-client": {
    ...TEMPLATES.find(t => t.id === "feedback-service-client"),
    questions: [
      { text: "Par quel canal nous avez-vous contactés ?", question_type: "single", choices: [{ text: "Téléphone" }, { text: "Email" }, { text: "Chat" }] },
      { text: "Le délai de prise en charge était-il satisfaisant ?", question_type: "single", choices: [{ text: "Oui" }, { text: "Non" }] },
      { text: "Le problème a-t-il été résolu ?", question_type: "single", choices: [{ text: "Oui, totalement" }, { text: "Partiellement" }, { text: "Non" }] },
      { text: "Qualité de la réponse fournie", question_type: "single", choices: [{ text: "Excellente" }, { text: "Bonne" }, { text: "Insuffisante" }] },
      { text: "Nom de l'agent (si connu)", question_type: "text", choices: [] },
      { text: "Évaluer la politesse / professionnalisme", question_type: "single", choices: [{ text: "Très professionnel" }, { text: "Professionnel" }, { text: "Peu professionnel" }] },
      { text: "Quel canal préférez-vous pour être recontacté ?", question_type: "multiple", choices: [{ text: "Téléphone" }, { text: "Email" }, { text: "WhatsApp" }] },
      { text: "Combien de temps a duré l'échange (minutes) ?", question_type: "number", choices: [] },
      { text: "Que pourrait-on améliorer ?", question_type: "text", choices: [] },
      { text: "Commentaires supplémentaires", question_type: "text", choices: [] },
    ],
  },

  // 10 nouveaux presets (chaque preset : image + 10 questions professionnelles)
  "etude-de-marche": {
    ...TEMPLATES.find(t => t.id === "etude-de-marche"),
    questions: [
      { text: "Quel est votre profil client ?", question_type: "single", choices: [{ text: "Particulier" }, { text: "Professionnel" }]},
      { text: "Quel besoin principal cherchez-vous à couvrir ?", question_type: "text", choices: []},
      { text: "À quelle fréquence utilisez-vous des solutions similaires ?", question_type: "single", choices: [{ text: "Quotidien" }, { text: "Hebdomadaire" }, { text: "Mensuel" }, { text: "Rarement" }]},
      { text: "Critères d'achat les plus importants", question_type: "multiple", choices: [{ text: "Prix" }, { text: "Qualité" }, { text: "Disponibilité" }, { text: "Marque" }]},
      { text: "Quel budget seriez-vous prêt à consacrer (en FCFA) ?", question_type: "number", choices: []},
      { text: "Quels concurrents utilisez-vous actuellement ?", question_type: "text", choices: []},
      { text: "Quelles fonctionnalités ajouteriez-vous ?", question_type: "text", choices: []},
      { text: "Combien seriez-vous prêt à payer par mois ?", question_type: "number", choices: []},
      { text: "Avez-vous des barrières à l'achat ?", question_type: "text", choices: []},
      { text: "Autres commentaires", question_type: "text", choices: []},
    ]
  },

  "rh-climat-social": {
    ...TEMPLATES.find(t => t.id === "rh-climat-social"),
    questions: [
      { text: "Comment évaluez-vous votre satisfaction au travail ?", question_type: "single", choices: [{ text: "Très satisfait" }, { text: "Satisfait" }, { text: "Neutre" }, { text: "Insatisfait" }]},
      { text: "Ressentez-vous du stress lié au travail ?", question_type: "single", choices: [{ text: "Souvent" }, { text: "Parfois" }, { text: "Rarement" }]},
      { text: "Qualité de la communication interne", question_type: "single", choices: [{ text: "Excellente" }, { text: "Bonne" }, { text: "Moyenne" }, { text: "Faible" }]},
      { text: "Vos managers sont-ils disponibles ?", question_type: "single", choices: [{ text: "Oui" }, { text: "Parfois" }, { text: "Non" }]},
      { text: "Évaluez l'équilibre vie pro / perso", question_type: "single", choices: [{ text: "Excellent" }, { text: "Bon" }, { text: "Moyen" }, { text: "Mauvais" }]},
      { text: "Avez-vous des suggestions pour améliorer l'ambiance ?", question_type: "text", choices: []},
      { text: "Diriez-vous que la charge de travail est raisonnable ?", question_type: "single", choices: [{ text: "Oui" }, { text: "Non" }]},
      { text: "Quels avantages aimeriez-vous voir ajoutés ?", question_type: "multiple", choices: [{ text: "Formation" }, { text: "Prime" }, { text: "Télétravail" }]},
      { text: "Depuis combien de temps travaillez-vous ici (ans) ?", question_type: "number", choices: []},
      { text: "Commentaires additionnels", question_type: "text", choices: []},
    ]
  },

  "evaluation-formation": {
    ...TEMPLATES.find(t => t.id === "evaluation-formation"),
    questions: [
      { text: "Quel est votre rôle lors de la formation ?", question_type: "single", choices: [{ text: "Participant" }, { text: "Formateur" }, { text: "Organisateur" }]},
      { text: "La formation a-t-elle atteint ses objectifs ?", question_type: "single", choices: [{ text: "Oui" }, { text: "Partiellement" }, { text: "Non" }]},
      { text: "Qualité pédagogique (contenu)", question_type: "single", choices: [{ text: "Excellente" }, { text: "Bonne" }, { text: "Moyenne" }]},
      { text: "Qualité pédagogique (animation)", question_type: "single", choices: [{ text: "Excellente" }, { text: "Bonne" }, { text: "Moyenne" }]},
      { text: "Durée de la formation adaptée ?", question_type: "single", choices: [{ text: "Trop court" }, { text: "Adéquat" }, { text: "Trop long" }]},
      { text: "Avez-vous des propositions pour améliorer le contenu ?", question_type: "text", choices: []},
      { text: "Recommanderiez-vous cette formation ?", question_type: "single", choices: [{ text: "Oui" }, { text: "Non" }]},
      { text: "Quel élément a le plus de valeur pour vous ?", question_type: "text", choices: []},
      { text: "Note globale sur 10", question_type: "number", choices: []},
      { text: "Commentaires finaux", question_type: "text", choices: []},
    ]
  },

  "inscription-evenement": {
    ...TEMPLATES.find(t => t.id === "inscription-evenement"),
    questions: [
      { text: "Nom complet", question_type: "text", choices: []},
      { text: "Email de contact", question_type: "text", choices: []},
      { text: "Numéro de téléphone", question_type: "text", choices: []},
      { text: "Organisation / Entreprise", question_type: "text", choices: []},
      { text: "Souhaitez-vous une facture ?", question_type: "single", choices: [{ text: "Oui" }, { text: "Non" }]},
      { text: "Type de ticket souhaité", question_type: "single", choices: [{ text: "Standard" }, { text: "VIP" }, { text: "Groupe" }]},
      { text: "Allergies / restrictions alimentaires", question_type: "text", choices: []},
      { text: "Nombre de participants (si groupe)", question_type: "number", choices: []},
      { text: "Avez-vous des besoins spécifiques ?", question_type: "text", choices: []},
      { text: "Commentaires supplémentaires", question_type: "text", choices: []},
    ]
  },

  "suivi-terrain": {
    ...TEMPLATES.find(t => t.id === "suivi-terrain"),
    questions: [
      { text: "Date de la visite", question_type: "text", choices: []},
      { text: "Nom de l'enquêteur", question_type: "text", choices: []},
      { text: "Localisation (ville / district)", question_type: "text", choices: []},
      { text: "Type d'activité observée", question_type: "single", choices: [{ text: "Vente" }, { text: "Inventaire" }, { text: "Visite client" }]},
      { text: "Stock disponible (quantité)", question_type: "number", choices: []},
      { text: "Principales observations", question_type: "text", choices: []},
      { text: "Photos (URL ou note)", question_type: "text", choices: []},
      { text: "Le point de vente respecte-t-il nos procédures ?", question_type: "single", choices: [{ text: "Oui" }, { text: "Partiellement" }, { text: "Non" }]},
      { text: "Actions recommandées", question_type: "text", choices: []},
      { text: "Signature / code enquêteur", question_type: "text", choices: []},
    ]
  },

  "satisfaction-employes": {
    ...TEMPLATES.find(t => t.id === "satisfaction-employes"),
    questions: [
      { text: "Êtes-vous satisfait de vos missions actuelles ?", question_type: "single", choices: [{ text: "Oui" }, { text: "Non" }]},
      { text: "Avez-vous des opportunités de développement suffisantes ?", question_type: "single", choices: [{ text: "Oui" }, { text: "Non" }]},
      { text: "Ressentez-vous un bon esprit d'équipe ?", question_type: "single", choices: [{ text: "Oui" }, { text: "Parfois" }, { text: "Non" }]},
      { text: "Avez-vous des difficultés avec les outils fournis ?", question_type: "single", choices: [{ text: "Oui" }, { text: "Non" }]},
      { text: "Quel est votre niveau de motivation (1-10) ?", question_type: "number", choices: []},
      { text: "Suggestions pour améliorer l'engagement", question_type: "text", choices: []},
      { text: "Souhaitez-vous un échange RH ?", question_type: "single", choices: [{ text: "Oui" }, { text: "Non" }]},
      { text: "Quels avantages seraient les plus motivants ?", question_type: "multiple", choices: [{ text: "Prime" }, { text: "Formation" }, { text: "Télétravail" }]},
      { text: "Depuis combien de temps travaillez-vous ici (années) ?", question_type: "number", choices: []},
      { text: "Commentaires additionnels", question_type: "text", choices: []},
    ]
  },

  "avis-produit": {
    ...TEMPLATES.find(t => t.id === "avis-produit"),
    questions: [
      { text: "Quel produit testez-vous ?", question_type: "text", choices: []},
      { text: "Depuis combien de temps l'utilisez-vous ?", question_type: "single", choices: [{ text: "<1 mois" }, { text: "1-6 mois" }, { text: ">6 mois" }]},
      { text: "Notez la qualité sur 10", question_type: "number", choices: []},
      { text: "Fonctionnalités appréciées", question_type: "multiple", choices: [{ text: "Performance" }, { text: "Design" }, { text: "Prix" }]},
      { text: "Rencontrez-vous des problèmes ?", question_type: "single", choices: [{ text: "Oui" }, { text: "Non" }]},
      { text: "Si oui, détaillez le problème", question_type: "text", choices: []},
      { text: "Recommanderiez-vous ce produit ?", question_type: "single", choices: [{ text: "Oui" }, { text: "Non" }]},
      { text: "Quel prix estimez-vous juste pour ce produit ?", question_type: "number", choices: []},
      { text: "Améliorations souhaitées", question_type: "text", choices: []},
      { text: "Commentaires supplémentaires", question_type: "text", choices: []},
    ]
  },

  "demande-support": {
    ...TEMPLATES.find(t => t.id === "demande-support"),
    questions: [
      { text: "Nom", question_type: "text", choices: []},
      { text: "Service concerné", question_type: "text", choices: []},
      { text: "Description du problème", question_type: "text", choices: []},
      { text: "Priorité", question_type: "single", choices: [{ text: "Haute" }, { text: "Moyenne" }, { text: "Basse" }]},
      { text: "Pièces jointes / références", question_type: "text", choices: []},
      { text: "Numéro de ticket (si existant)", question_type: "text", choices: []},
      { text: "Souhaitez-vous un rappel ?", question_type: "single", choices: [{ text: "Oui" }, { text: "Non" }]},
      { text: "Meilleur créneau pour contact", question_type: "text", choices: []},
      { text: "Temps estimé pour résolution (min)", question_type: "number", choices: []},
      { text: "Commentaire final", question_type: "text", choices: []},
    ]
  },

  "formulaire-contact": {
    ...TEMPLATES.find(t => t.id === "formulaire-contact"),
    questions: [
      { text: "Nom complet", question_type: "text", choices: []},
      { text: "Email", question_type: "text", choices: []},
      { text: "Téléphone", question_type: "text", choices: []},
      { text: "Objet de la demande", question_type: "single", choices: [{ text: "Commercial" }, { text: "Support" }, { text: "Partenariat" }]},
      { text: "Message", question_type: "text", choices: []},
      { text: "Souhaitez-vous être recontacté ?", question_type: "single", choices: [{ text: "Oui" }, { text: "Non" }]},
      { text: "Mode de contact préféré", question_type: "single", choices: [{ text: "Email" }, { text: "Téléphone" }, { text: "WhatsApp" }]},
      { text: "Entreprise (si applicable)", question_type: "text", choices: []},
      { text: "Ville", question_type: "text", choices: []},
      { text: "Commentaires", question_type: "text", choices: []},
    ]
  },

  "evaluation-commerciale": {
    ...TEMPLATES.find(t => t.id === "evaluation-commerciale"),
    questions: [
      { text: "Point de vente / commercial évalué", question_type: "text", choices: []},
      { text: "Date de la visite", question_type: "text", choices: []},
      { text: "Nombre de ventes observées", question_type: "number", choices: []},
      { text: "Merchandising respecté ?", question_type: "single", choices: [{ text: "Oui" }, { text: "Partiellement" }, { text: "Non" }]},
      { text: "Accueil client", question_type: "single", choices: [{ text: "Très bon" }, { text: "Bon" }, { text: "Moyen" }]},
      { text: "Produits épuisés ?", question_type: "single", choices: [{ text: "Oui" }, { text: "Non" }]},
      { text: "Remarques sur la présentation", question_type: "text", choices: []},
      { text: "Recommandations pour amélioration", question_type: "text", choices: []},
      { text: "Score global (1-10)", question_type: "number", choices: []},
      { text: "Commentaires additionnels", question_type: "text", choices: []},
    ]
  }
};

export default {
  TEMPLATES,
  PRESETS
};
