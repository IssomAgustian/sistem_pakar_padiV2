"""
AI Solution Service
Sistem Pakar Diagnosis Penyakit Tanaman Padi
Menggunakan OpenAI atau Google Gemini untuk generate solusi
"""

import os
import json
import importlib


def _optional_import(module_name):
    try:
        return importlib.import_module(module_name)
    except ImportError:
        return None


openai = _optional_import("openai")
genai = _optional_import("google.generativeai")


class AISolutionService:
    """
    AI Solution Generator
    Generates treatment solutions using AI (OpenAI GPT or Google Gemini)
    Reads configuration from System Settings database
    """

    def __init__(self):
        # Get AI configuration from database (System Settings)
        from app.models.system_settings import SystemSettings

        # Get AI provider from database, fallback to env variable
        provider_setting = SystemSettings.query.filter_by(setting_key='ai_provider').first()
        self.provider = provider_setting.setting_value.lower() if provider_setting else os.getenv('AI_PROVIDER', 'gemini').lower()

        if self.provider == 'openai' and openai:
            # Get OpenAI API key from database
            api_key_setting = SystemSettings.query.filter_by(setting_key='openai_api_key').first()
            api_key = api_key_setting.setting_value if api_key_setting else os.getenv('OPENAI_API_KEY')

            if api_key:
                # Store API key for later use, will be used in _generate_with_openai
                self.api_key = api_key
                self.model = 'gpt-3.5-turbo'  # Using gpt-3.5-turbo for cost efficiency
                print(f"✅ AI Service initialized with OpenAI (gpt-3.5-turbo)")
            else:
                print("❌ OpenAI API key not found")
                self.provider = None
                self.model = None
                self.api_key = None

        elif self.provider == 'gemini' and genai:
            # Get Gemini API key from database
            api_key_setting = SystemSettings.query.filter_by(setting_key='gemini_api_key').first()
            api_key = api_key_setting.setting_value if api_key_setting else os.getenv('GEMINI_API_KEY')

            if api_key:
                try:
                    genai.configure(api_key=api_key)
                    # Use gemini-flash-latest (always points to the latest stable version)
                    self.model = genai.GenerativeModel('gemini-flash-latest')
                    print(f"✅ AI Service initialized with Gemini (gemini-flash-latest)")
                except Exception as e:
                    print(f"❌ Failed to initialize Gemini: {e}")
                    self.provider = None
                    self.model = None
            else:
                print("❌ Gemini API key not found")
                self.provider = None
                self.model = None
        else:
            print(f"❌ AI Provider '{self.provider}' not available or not configured")
            self.provider = None
            self.model = None

    def generate_solution(self, disease, confidence, diagnosis_method='forward_chaining', secondary_diseases=None):
        """
        Generate complete treatment solution for diagnosed disease

        Args:
            disease: Disease object
            confidence: Confidence level (0.0 to 1.0)
            diagnosis_method: Method used for diagnosis

        Returns:
            dict: {
                'raw_text': str,
                'structured': {
                    'langkah_penanganan': [],
                    'rekomendasi_obat': [],
                    'panduan_penggunaan': [],
                    'pencegahan': []
                }
            }
        """
        if not self.provider or not self.model:
            print(f"⚠️  AI Service not configured. Provider: {self.provider}, Model: {self.model}")
            print(f"⚠️  Using fallback solution for {disease.name}")
            return self._generate_fallback_solution(disease, secondary_diseases)

        prompt = self._create_prompt(disease, confidence, diagnosis_method, secondary_diseases)

        try:
            print(f"🔄 Generating AI solution using {self.provider}...")
            if self.provider == 'openai':
                result = self._generate_with_openai(prompt)
                print(f"✅ AI solution generated successfully with OpenAI")
                return result
            elif self.provider == 'gemini':
                result = self._generate_with_gemini(prompt)
                print(f"✅ AI solution generated successfully with Gemini")
                return result
        except Exception as e:
            print(f"❌ AI Generation Error: {type(e).__name__}: {str(e)}")
            import traceback
            traceback.print_exc()
            print(f"⚠️  Falling back to generic solution")
            return self._generate_fallback_solution(disease, secondary_diseases)

    def _create_prompt(self, disease, confidence, method, secondary_diseases=None):
        """Create prompt for AI"""
        secondary_section = ''
        if secondary_diseases:
            secondary_list = '\n'.join(
                f"- {item.get('name')} ({item.get('code')})"
                for item in secondary_diseases
                if item.get('name')
            )
            secondary_section = f"""

PENYAKIT LAIN YANG MUNGKIN:
{secondary_list}
"""

        prompt = f"""
Anda adalah ahli pertanian spesialis penyakit tanaman padi. Berikan solusi lengkap untuk penyakit berikut:

Penyakit: {disease.name}
Deskripsi: {disease.description}
Tingkat Keyakinan: {confidence * 100:.1f}%
Metode Diagnosis: {method}
{secondary_section}

Berikan solusi dalam format JSON dengan struktur berikut:
{{
    "langkah_penanganan": [
        "Langkah 1: ...",
        "Langkah 2: ...",
        ...
    ],
    "rekomendasi_obat": [
        {{
            "nama": "Nama Obat",
            "jenis": "Fungisida/Bakterisida/etc",
            "dosis": "Dosis yang direkomendasikan",
            "cara_pakai": "Cara penggunaan"
        }},
        ...
    ],
    "panduan_penggunaan": [
        "Panduan 1: ...",
        "Panduan 2: ...",
        ...
    ],
    "pencegahan": [
        "Langkah pencegahan 1: ...",
        "Langkah pencegahan 2: ...",
        ...
    ],
    "pencegahan_penyakit_lain": [
        {{
            "penyakit": "Nama penyakit lain",
            "langkah": [
                "Langkah pencegahan singkat 1",
                "Langkah pencegahan singkat 2"
            ]
        }}
    ]
}}

Berikan minimal 3-5 langkah untuk setiap kategori.
Untuk penyakit lain, berikan langkah pencegahan singkat (2-3 poin) saja.
Jika tidak ada penyakit lain, isi "pencegahan_penyakit_lain" dengan array kosong.
Fokus pada solusi praktis dan efektif untuk petani Indonesia.
"""
        return prompt

    def _generate_with_openai(self, prompt):
        """Generate using OpenAI GPT"""
        if not openai:
            raise RuntimeError("Library OpenAI belum terinstall. Jalankan: pip install openai")

        OpenAI = getattr(openai, "OpenAI", None)
        if OpenAI is None:
            raise RuntimeError("Versi library OpenAI tidak mendukung OpenAI client. Jalankan: pip install --upgrade openai")

        # Get API key from settings
        from app.models.system_settings import SystemSettings
        api_key_setting = SystemSettings.query.filter_by(setting_key='openai_api_key').first()
        api_key = api_key_setting.setting_value if api_key_setting else os.getenv('OPENAI_API_KEY')

        client = OpenAI(api_key=api_key)

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",  # Using gpt-3.5-turbo for cost efficiency
            messages=[
                {"role": "system", "content": "You are an expert agricultural advisor specializing in rice plant diseases."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1500
        )

        raw_text = response.choices[0].message.content

        # Try to parse JSON from response
        try:
            # Find JSON in response
            start = raw_text.find('{')
            end = raw_text.rfind('}') + 1
            json_str = raw_text[start:end]
            structured = json.loads(json_str)
        except:
            structured = self._parse_text_to_structured(raw_text)

        return {
            'raw_text': raw_text,
            'structured': structured
        }

    def _generate_with_gemini(self, prompt):
        """Generate using Google Gemini"""
        if not genai:
            raise RuntimeError("Library Google Generative AI belum terinstall. Jalankan: pip install google-generativeai")
        response = self.model.generate_content(prompt)
        raw_text = response.text

        # Try to parse JSON from response
        try:
            start = raw_text.find('{')
            end = raw_text.rfind('}') + 1
            json_str = raw_text[start:end]
            structured = json.loads(json_str)
        except:
            structured = self._parse_text_to_structured(raw_text)

        return {
            'raw_text': raw_text,
            'structured': structured
        }

    def _parse_text_to_structured(self, text):
        """Parse plain text into structured format"""
        return {
            'langkah_penanganan': [
                "Identifikasi dan isolasi tanaman yang terinfeksi",
                "Buang bagian tanaman yang terinfeksi parah",
                "Aplikasikan treatment sesuai rekomendasi"
            ],
            'rekomendasi_obat': [
                {
                    'nama': 'Fungisida/Bakterisida yang sesuai',
                    'jenis': 'Sesuai jenis penyakit',
                    'dosis': 'Ikuti petunjuk pada kemasan',
                    'cara_pakai': 'Semprotkan secara merata'
                }
            ],
            'panduan_penggunaan': [
                "Gunakan alat pelindung diri",
                "Aplikasikan pada pagi atau sore hari",
                "Hindari aplikasi saat hujan"
            ],
            'pencegahan': [
                "Gunakan bibit berkualitas",
                "Jaga kebersihan lahan",
                "Rotasi tanaman"
            ],
            'pencegahan_penyakit_lain': []
        }

    def _generate_fallback_solution(self, disease, secondary_diseases=None):
        """Generate basic solution without AI"""
        other_prevention = []
        if secondary_diseases:
            for item in secondary_diseases:
                name = item.get('name') or 'Penyakit lain'
                other_prevention.append({
                    'penyakit': name,
                    'langkah': [
                        'Gunakan bibit sehat dan bersertifikat',
                        'Jaga sanitasi lahan dan sisa tanaman'
                    ]
                })

        return {
            'raw_text': f"Solusi dasar untuk {disease.name}",
            'structured': {
                'langkah_penanganan': [
                    "Identifikasi gejala penyakit secara detail",
                    "Pisahkan tanaman yang terinfeksi",
                    "Lakukan treatment sesuai jenis penyakit",
                    "Monitor perkembangan tanaman"
                ],
                'rekomendasi_obat': [
                    {
                        'nama': 'Konsultasi dengan ahli pertanian setempat',
                        'jenis': 'Sesuai diagnosis',
                        'dosis': 'Mengikuti petunjuk penggunaan',
                        'cara_pakai': 'Aplikasi sesuai rekomendasi'
                    }
                ],
                'panduan_penggunaan': [
                    "Gunakan perlindungan diri saat aplikasi pestisida",
                    "Aplikasikan di pagi atau sore hari",
                    "Hindari penggunaan berlebihan",
                    "Ikuti jadwal aplikasi yang disarankan"
                ],
                'pencegahan': [
                    "Gunakan varietas tahan penyakit",
                    "Jaga sanitasi lahan",
                    "Kelola air dengan baik",
                    "Lakukan rotasi tanaman"
                ],
                'pencegahan_penyakit_lain': other_prevention
            }
        }
