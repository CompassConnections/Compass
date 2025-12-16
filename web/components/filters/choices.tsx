import {invert} from "lodash";
import {FaHeart, FaUsers} from "react-icons/fa";
import {FiUser} from "react-icons/fi";
import {GiRing} from "react-icons/gi";

export const RELATIONSHIP_CHOICES = {
  // Other: 'other',
  Collaboration: 'collaboration',
  Friendship: 'friendship',
  Relationship: 'relationship',
};

export const RELATIONSHIP_STATUS_CHOICES = {
  'Single': 'single',
  'Married': 'married',
  'In casual relationship': 'casual',
  'In long-term relationship': 'long_term',
  'In open relationship': 'open',
};

export const RELATIONSHIP_ICONS = {
  single: FiUser,
  married: GiRing,
  casual: FaHeart,
  long_term: FaHeart,
  open: FaUsers,
} as const;

export const ROMANTIC_CHOICES = {
  Monogamous: 'mono',
  Polyamorous: 'poly',
  'Open Relationship': 'open',
};

export const POLITICAL_CHOICES = {
  Progressive: 'progressive',
  Liberal: 'liberal',
  'Moderate / Centrist': 'moderate',
  Conservative: 'conservative',
  Socialist: 'socialist',
  Nationalist: 'nationalist',
  Populist: 'populist',
  'Green / Eco-Socialist': 'green',
  Technocratic: 'technocratic',
  Libertarian: 'libertarian',
  'Effective Accelerationism': 'e/acc',
  'Pause AI / Tech Skeptic': 'pause ai',
  'Independent / Other': 'other',
}

export const DIET_CHOICES = {
  Omnivore: 'omnivore',
  Vegetarian: 'veg',
  Vegan: 'vegan',
  Keto: 'keto',
  Paleo: 'paleo',
  Pescetarian: 'pescetarian',
  Other: 'other',
}

export const EDUCATION_CHOICES = {
  'High school': 'high-school',
  'College': 'some-college',
  'Bachelors': 'bachelors',
  'Masters': 'masters',
  'PhD': 'doctorate',
}

export const RELIGION_CHOICES = {
  'Atheist': 'atheist',
  'Agnostic': 'agnostic',
  'Spiritual': 'spiritual',
  'Christian': 'christian',
  'Muslim': 'muslim',
  'Jewish': 'jewish',
  'Hindu': 'hindu',
  'Buddhist': 'buddhist',
  'Sikh': 'sikh',
  'Taoist': 'taoist',
  'Jain': 'jain',
  'Shinto': 'shinto',
  'Animist': 'animist',
  'Zoroastrian': 'zoroastrian',
  'Unitarian Universalist': 'unitarian_universalist',
  'Other': 'other',
}

export const LANGUAGE_CHOICES = {
  'Akan': 'akan',
  'Amharic': 'amharic',
  'Arabic': 'arabic',
  'Assamese': 'assamese',
  'Awadhi': 'awadhi',
  'Azerbaijani': 'azerbaijani',
  'Balochi': 'balochi',
  'Belarusian': 'belarusian',
  'Bengali': 'bengali',
  'Bhojpuri': 'bhojpuri',
  'Burmese': 'burmese',
  'Cebuano': 'cebuano',
  'Chewa': 'chewa',
  'Chhattisgarhi': 'chhattisgarhi',
  'Chittagonian': 'chittagonian',
  'Czech': 'czech',
  'Deccan': 'deccan',
  'Dhundhari': 'dhundhari',
  'Dutch': 'dutch',
  'Eastern Min': 'eastern-min',
  'English': 'english',
  'French': 'french',
  'Fula': 'fula',
  'Gan': 'gan',
  'German': 'german',
  'Greek': 'greek',
  'Gujarati': 'gujarati',
  'Haitian Creole': 'haitian-creole',
  'Hakka': 'hakka',
  'Haryanvi': 'haryanvi',
  'Hausa': 'hausa',
  'Hiligaynon': 'hiligaynon',
  'Hindi': 'hindi',
  'Hmong': 'hmong',
  'Hungarian': 'hungarian',
  'Igbo': 'igbo',
  'Ilocano': 'ilocano',
  'Italian': 'italian',
  'Japanese': 'japanese',
  'Javanese': 'javanese',
  'Jin': 'jin',
  'Kannada': 'kannada',
  'Kazakh': 'kazakh',
  'Khmer': 'khmer',
  'Kinyarwanda': 'kinyarwanda',
  'Kirundi': 'kirundi',
  'Konkani': 'konkani',
  'Korean': 'korean',
  'Kurdish': 'kurdish',
  'Madurese': 'madurese',
  'Magahi': 'magahi',
  'Maithili': 'maithili',
  'Malagasy': 'malagasy',
  'Malay/Indonesian': 'malay/indonesian',
  'Malayalam': 'malayalam',
  'Mandarin': 'mandarin',
  'Marathi': 'marathi',
  'Marwari': 'marwari',
  'Mossi': 'mossi',
  'Nepali': 'nepali',
  'Northern Min': 'northern-min',
  'Odia': 'odia',
  'Oromo': 'oromo',
  'Pashto': 'pashto',
  'Persian': 'persian',
  'Polish': 'polish',
  'Portuguese': 'portuguese',
  'Punjabi': 'punjabi',
  'Quechua': 'quechua',
  'Romanian': 'romanian',
  'Russian': 'russian',
  'Saraiki': 'saraiki',
  'Serbo-Croatian': 'serbo-croatian',
  'Shona': 'shona',
  'Sindhi': 'sindhi',
  'Sinhala': 'sinhala',
  'Somali': 'somali',
  'Southern Min': 'southern-min',
  'Spanish': 'spanish',
  'Sundanese': 'sundanese',
  'Swedish': 'swedish',
  'Swahili': 'swahili',
  'Sylheti': 'sylheti',
  'Tagalog': 'tagalog',
  'Tamil': 'tamil',
  'Telugu': 'telugu',
  'Thai': 'thai',
  'Turkish': 'turkish',
  'Turkmen': 'turkmen',
  'Ukrainian': 'ukrainian',
  'Urdu': 'urdu',
  'Uyghur': 'uyghur',
  'Uzbek': 'uzbek',
  'Vietnamese': 'vietnamese',
  'Wu': 'wu',
  'Xhosa': 'xhosa',
  'Xiang': 'xiang',
  'Yoruba': 'yoruba',
  'Yue': 'yue',
  'Zhuang': 'zhuang',
  'Zulu': 'zulu',
}

export const RACE_CHOICES = {
  'Black/African origin': 'african',
  'East Asian': 'asian',
  'South/Southeast Asian': 'south_asian',
  'White/Caucasian': 'caucasian',
  'Hispanic/Latino': 'hispanic',
  'Middle Eastern': 'middle_eastern',
  'Native American/Indigenous': 'native_american',
  Other: 'other',
}

export const MBTI_CHOICES = {
  'INTJ': 'intj',
  'INTP': 'intp',
  'INFJ': 'infj',
  'INFP': 'infp',
  'ISTJ': 'istj',
  'ISTP': 'istp',
  'ISFJ': 'isfj',
  'ISFP': 'isfp',
  'ENTJ': 'entj',
  'ENTP': 'entp',
  'ENFJ': 'enfj',
  'ENFP': 'enfp',
  'ESTJ': 'estj',
  'ESTP': 'estp',
  'ESFJ': 'esfj',
  'ESFP': 'esfp',
}

export const INVERTED_RELATIONSHIP_CHOICES = invert(RELATIONSHIP_CHOICES)
export const INVERTED_RELATIONSHIP_STATUS_CHOICES = invert(RELATIONSHIP_STATUS_CHOICES)
export const INVERTED_ROMANTIC_CHOICES = invert(ROMANTIC_CHOICES)
export const INVERTED_POLITICAL_CHOICES = invert(POLITICAL_CHOICES)
export const INVERTED_DIET_CHOICES = invert(DIET_CHOICES)
export const INVERTED_EDUCATION_CHOICES = invert(EDUCATION_CHOICES)
export const INVERTED_RELIGION_CHOICES = invert(RELIGION_CHOICES)
export const INVERTED_LANGUAGE_CHOICES = invert(LANGUAGE_CHOICES)
export const INVERTED_RACE_CHOICES = invert(RACE_CHOICES)
export const INVERTED_MBTI_CHOICES = invert(MBTI_CHOICES)