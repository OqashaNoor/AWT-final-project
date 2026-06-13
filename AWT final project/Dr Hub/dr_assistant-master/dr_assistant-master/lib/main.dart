import 'dart:convert';
import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(DrAssistantApp());
}

class patient{
  String name;
  int age;
  patient({required this.name, required this.age});
}

class DrAssistantApp extends StatefulWidget {
  @override
  State<DrAssistantApp> createState() => _DrAssistantAppState();
}

class _DrAssistantAppState extends State<DrAssistantApp> {
  ThemeMode _themeMode = ThemeMode.light;
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    _loadTheme();
  }

  Future<void> _loadTheme() async {
    final prefs = await SharedPreferences.getInstance();
    final s = prefs.getString('app_theme') ?? 'light';
    setState(() {
      _themeMode = s == 'dark' ? ThemeMode.dark : ThemeMode.light;
      _loaded = true;
    });
  }

  void _changeTheme(ThemeMode mode) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('app_theme', mode == ThemeMode.dark ? 'dark' : 'light');
    setState(() => _themeMode = mode);
  }

  @override
  Widget build(BuildContext context) {
    if (!_loaded) return Container(color: Colors.white);
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Dr. Assistant',
      themeMode: _themeMode,
      theme: ThemeData(
        primarySwatch: Colors.blue,
        brightness: Brightness.light,
        scaffoldBackgroundColor: Color(0xFFF3F6FB),
        fontFamily: 'Roboto',
      ),
      darkTheme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: Color(0xFF0B1020),
        primarySwatch: Colors.blue,
        fontFamily: 'Roboto',
      ),
      home: HomePage(onThemeChanged: _changeTheme, themeMode: _themeMode),
    );
  }
}
/* --------------------------
   Model: Patient
   --------------------------*/
class Patient {
  String id;
  String? imagePath;
  String fullName;
  String phone;
  String email;
  int? age;
  String? gender;
  String? address;
  String? notes;
  DateTime createdAt;

  Patient({
    required this.id,
    this.imagePath,
    required this.fullName,
    required this.phone,
    required this.email,
    this.age,
    this.gender,
    this.address,
    this.notes,
    required this.createdAt,
  });

  factory Patient.fromJson(Map<String, dynamic> j) => Patient(
    id: j['id'],
    imagePath: j['imagePath'],
    fullName: j['fullName'],
    phone: j['phone'],
    email: j['email'],
    age: j['age'] != null ? (j['age'] as num).toInt() : null,
    gender: j['gender'],
    address: j['address'],
    notes: j['notes'],
    createdAt: DateTime.parse(j['createdAt']),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'imagePath': imagePath,
    'fullName': fullName,
    'phone': phone,
    'email': email,
    'age': age,
    'gender': gender,
    'address': address,
    'notes': notes,
    'createdAt': createdAt.toIso8601String(),
  };
}

/* --------------------------
   Storage helper
   --------------------------*/
class StorageService {
  static const String key = 'patients_json';

  static Future<List<Patient>> loadPatients() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(key);
    if (raw == null) return [];
    final list = jsonDecode(raw) as List<dynamic>;
    return list.map((e) => Patient.fromJson(e)).toList();
  }

  static Future<void> savePatients(List<Patient> list) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = jsonEncode(list.map((e) => e.toJson()).toList());
    await prefs.setString(key, raw);
  }

  static Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(key);
  }

  static Future<File> exportToFile() async {
    final patients = await loadPatients();
    final jsonString = jsonEncode(patients.map((e) => e.toJson()).toList());
    final dir = await getExternalStorageDirectory() ?? await getApplicationDocumentsDirectory();
    // try to write to Downloads if possible:
    Directory? parent = dir;
    if (Platform.isAndroid) {
      // go up to root of external storage if possible
      parent = Directory('/storage/emulated/0/Download');
    }
    final file = File(p.join(parent!.path, 'dr_assistant_export_${DateTime.now().millisecondsSinceEpoch}.json'));
    await file.writeAsString(jsonString);
    return file;
  }

  static Future<void> importFromFile(File file) async {
    final content = await file.readAsString();
    final data = jsonDecode(content) as List<dynamic>;
    final patients = data.map((e) => Patient.fromJson(e)).toList();
    await savePatients(patients);
  }
}
/* --------------------------
   Home Page
   --------------------------*/
class HomePage extends StatefulWidget {
  final Function(ThemeMode) onThemeChanged;
  final ThemeMode themeMode;
  HomePage({required this.onThemeChanged, required this.themeMode});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  List<Patient> _patients = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    setState(() => _loading = true);
    _patients = await StorageService.loadPatients();
    _patients.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    setState(() => _loading = false);
  }

  int getTodayCount() {
    final today = DateTime.now();
    return _patients.where((p) =>
    p.createdAt.year == today.year &&
        p.createdAt.month == today.month &&
        p.createdAt.day == today.day).length;
  }

  List<Patient> get recentFive => _patients.take(5).toList();

  void _openAdd() async {
    final res = await Navigator.push(context, MaterialPageRoute(builder: (_) => AddPatientPage()));
    if (res == true) await _refresh();
  }

  void _openAllPatients() async {
    await Navigator.push(context, MaterialPageRoute(builder: (_) => AllPatientsPage()));
    await _refresh();
  }

  void _openSearch() async {
    await Navigator.push(context, MaterialPageRoute(builder: (_) => SearchPage()));
    await _refresh();
  }

  void _openSettings() async {
    await Navigator.push(context, MaterialPageRoute(builder: (_) => SettingsPage(
      onThemeChange: widget.onThemeChanged,
      currentTheme: widget.themeMode,
    )));
    await _refresh();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final now = DateTime.now();
    final dateString = "${_weekdayName(now.weekday)}, ${_monthName(now.month)} ${now.day}, ${now.year}";
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        toolbarHeight: 110,
        title: Padding(
          padding: const EdgeInsets.only(top: 18.0),
          child: Text("Dr. Assistant", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 22, color: theme.brightness == Brightness.light ? Colors.white : Colors.white)),
        ),
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [Color(0xFF4C8BF5), Color(0xFF7AA7FF)]),
            borderRadius: BorderRadius.vertical(bottom: Radius.circular(0)),
          ),
          child: Align(
            alignment: Alignment.centerRight,
            child: IconButton(
              onPressed: _openSettings,
              icon: Icon(Icons.settings, color: Colors.white),
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: _loading
            ? Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
          physics: AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Greeting card
              Container(
                width: double.infinity,
                padding: EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: [Color(0xFF4C8BF5), Color(0xFF7AA7FF)]),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0,4))],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Good Morning!", style: TextStyle(fontSize: 24, color: Colors.white, fontWeight: FontWeight.w600)),
                    SizedBox(height: 8),
                    Text("Today is $dateString", style: TextStyle(color: Colors.white70)),
                  ],
                ),
              ),
              SizedBox(height: 18),
              Text("Today's Overview", style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              Container(
                padding: EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Theme.of(context).brightness==Brightness.light ? Color(0xFFEFF7EF) : Colors.grey[800],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.green.withOpacity(0.4)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.people, size: 36, color: Colors.green),
                    SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("${getTodayCount()}", style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.green)),
                        Text("New Patients", style: TextStyle(color: Colors.green[700])),
                      ],
                    )
                  ],
                ),
              ),
              SizedBox(height: 18),
              Text("Quick Actions", style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
              SizedBox(height: 12),
              Row(
                children: [
                  Expanded(child: QuickCard(icon: Icons.person_add, label: "New Patient", onTap: _openAdd)),
                  SizedBox(width: 12),
                  Expanded(child: QuickCard(icon: Icons.search, label: "Search", onTap: _openSearch)),
                ],
              ),
              SizedBox(height: 12),
              GestureDetector(
                onTap: _openAllPatients,
                child: Container(
                  padding: EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Theme.of(context).cardColor,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 6, offset: Offset(0,4))],
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(child: Icon(Icons.group, color: Colors.orange), backgroundColor: Colors.orange[50]),
                      SizedBox(width: 12),
                      Text("All Patients", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                      Spacer(),
                      Text("${_patients.length}", style: TextStyle(color: Colors.grey)),
                    ],
                  ),
                ),
              ),
              SizedBox(height: 18),
              Text("Recent Patients", style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              ...recentFive.map((p) => PatientTile(patient: p, onTap: () => _openPatientDetail(p))).toList(),
              if (_patients.isEmpty) Padding(
                padding: const EdgeInsets.only(top: 12.0),
                child: Text("No patients added yet. Use + to add new patient.", style: TextStyle(color: Colors.grey)),
              ),
              SizedBox(height: 80),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _openAdd,
        child: Icon(Icons.add),
      ),
      bottomNavigationBar: BottomAppBar(
        color: Theme.of(context).brightness==Brightness.light ? Colors.black : Colors.black,
        child: SizedBox(height: 48),
      ),
    );
  }

  void _openPatientDetail(Patient p) {
    Navigator.push(context, MaterialPageRoute(builder: (context) => PatientDetailPage(patient: p))).then((onAdded) => _refresh());
  }

  String _weekdayName(int wd) {
    const names = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    return names[wd-1];
  }

  String _monthName(int m) {
    const names = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return names[m-1];
  }
}

/* --------------------------
   QuickCard Widget
   --------------------------*/
class QuickCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  QuickCard({required this.icon, required this.label, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 92,
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 6, offset: Offset(0,4))],
        ),
        child: Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            CircleAvatar(backgroundColor: Colors.green[50], child: Icon(icon, color: Colors.green)),
            SizedBox(height: 8),
            Text(label),
          ]),
        ),
      ),
    );
  }
}
/* --------------------------
   PatientTile
   --------------------------*/
class PatientTile extends StatelessWidget {
  final Patient patient;
  final VoidCallback onTap;
  PatientTile({required this.patient, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final img = (patient.imagePath != null && patient.imagePath!.isNotEmpty && File(patient.imagePath!).existsSync())
        ? Image.file(File(patient.imagePath!), width: 56, height: 56, fit: BoxFit.cover)
        : Icon(Icons.person, size: 40);
    return Card(
      margin: EdgeInsets.symmetric(vertical:6),
      child: ListTile(
        onTap: onTap,
        leading: ClipRRect(borderRadius: BorderRadius.circular(8), child: img),
        title: Text(patient.fullName),
        subtitle: Text(patient.phone),
        trailing: Text("${patient.createdAt.day}/${patient.createdAt.month}/${patient.createdAt.year}"),
      ),
    );
  }
}

/* --------------------------
   AddPatientPage
   --------------------------*/
class AddPatientPage extends StatefulWidget {
  @override
  State<AddPatientPage> createState() => _AddPatientPageState();
}

class _AddPatientPageState extends State<AddPatientPage> {
  final _formKey = GlobalKey<FormState>();
  final _fullName = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _age = TextEditingController();
  String? _gender;
  final _address = TextEditingController();
  final _notes = TextEditingController();
  String? _imagePath;
  bool _saving = false;

  Future<void> _pickImage(ImageSource src) async {
    final picker = ImagePicker();
    final XFile? picked = await picker.pickImage(source: src, imageQuality: 70, maxWidth: 800);
    if (picked != null) {
      // copy to app directory to persist
      final appDir = await getApplicationDocumentsDirectory();
      final fileName = p.basename(picked.path);
      final saved = await File(picked.path).copy(p.join(appDir.path, '${DateTime.now().millisecondsSinceEpoch}_$fileName'));
      setState(() => _imagePath = saved.path);
    }
  }

  Future<void> _savePatient() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final patient = Patient(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      imagePath: _imagePath,
      fullName: _fullName.text.trim(),
      phone: _phone.text.trim(),
      email: _email.text.trim(),
      age: _age.text.isEmpty ? null : int.tryParse(_age.text.trim()),
      gender: _gender,
      address: _address.text.trim(),
      notes: _notes.text.trim(),
      createdAt: DateTime.now(),
    );

    final list = await StorageService.loadPatients();
    list.insert(0, patient);
    await StorageService.savePatients(list);

    setState(() => _saving = false);
    Navigator.pop(context, true);
  }

  @override
  void dispose() {
    _fullName.dispose();
    _phone.dispose();
    _email.dispose();
    _age.dispose();
    _address.dispose();
    _notes.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Add Patient"),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(14),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              // profile preview
              GestureDetector(
                onTap: () => _showImageOptions(),
                child: CircleAvatar(
                  radius: 48,
                  backgroundColor: Colors.grey[200],
                  child: _imagePath == null ? Icon(Icons.camera_alt, size: 36) : null,
                  backgroundImage: _imagePath != null ? FileImage(File(_imagePath!)) : null,
                ),
              ),
              SizedBox(height: 12),
              TextFormField(
                controller: _fullName,
                decoration: InputDecoration(labelText: "Full Name"),
                validator: (v) => (v==null || v.trim().isEmpty) ? "Required" : null,
              ),
              SizedBox(height: 8),
              TextFormField(
                controller: _phone,
                decoration: InputDecoration(labelText: "Phone"),
                keyboardType: TextInputType.phone,
                validator: (v) => (v==null || v.trim().isEmpty) ? "Required" : null,
              ),
              SizedBox(height: 8),
              TextFormField(
                controller: _email,
                decoration: InputDecoration(labelText: "Email"),
                keyboardType: TextInputType.emailAddress,
              ),
              SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _age,
                      decoration: InputDecoration(labelText: "Age"),
                      keyboardType: TextInputType.number,
                    ),
                  ),
                  SizedBox(width: 12),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: _gender,
                      items: ['Male','Female','Other'].map((g) => DropdownMenuItem(child: Text(g), value: g)).toList(),
                      onChanged: (v) => setState(() => _gender = v),
                      decoration: InputDecoration(labelText: "Gender"),
                    ),
                  )
                ],
              ),
              SizedBox(height: 8),
              TextFormField(
                controller: _address,
                decoration: InputDecoration(labelText: "Address"),
                maxLines: 2,
              ),
              SizedBox(height: 8),
              TextFormField(
                controller: _notes,
                decoration: InputDecoration(labelText: "Notes"),
                maxLines: 3,
              ),
              SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _saving ? null : _savePatient,
                icon: _saving ? SizedBox(width:16, height:16, child: CircularProgressIndicator(color: Colors.white, strokeWidth:2)) : Icon(Icons.save),
                label: Text("Save Patient"),
              ),
            ],
          ),
        ),
      ),
    );
  }
  void _showImageOptions() {
    showModalBottomSheet(context: context, builder: (_) {
      return SafeArea(child: Wrap(
        children: [
          ListTile(leading: Icon(Icons.camera_alt), title: Text("Camera"), onTap: () { Navigator.pop(context); _pickImage(ImageSource.camera); }),
          ListTile(leading: Icon(Icons.photo), title: Text("Gallery"), onTap: () { Navigator.pop(context); _pickImage(ImageSource.gallery); }),
          if (_imagePath != null) ListTile(leading: Icon(Icons.delete), title: Text("Remove"), onTap: () { setState(() => _imagePath = null); Navigator.pop(context); }),
        ],
      ));
    });
  }
}

/* --------------------------
   All Patients Page
   --------------------------*/
class AllPatientsPage extends StatefulWidget {
  @override
  State<AllPatientsPage> createState() => _AllPatientsPageState();
}

class _AllPatientsPageState extends State<AllPatientsPage> {
  List<Patient> _list = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    _list = await StorageService.loadPatients();
    _list.sort((a,b)=> b.createdAt.compareTo(a.createdAt));
    setState(() => _loading = false);
  }

  Future<void> _deletePatient(Patient p) async {
    final confirm = await showDialog<bool>(context: context, builder: (_) => AlertDialog(
      title: Text("Delete Patient?"),
      content: Text("Are you sure you want to delete ${p.fullName}?"),
      actions: [TextButton(onPressed: ()=>Navigator.pop(context,false), child: Text("No")), TextButton(onPressed: ()=>Navigator.pop(context,true), child: Text("Yes"))],
    ));
    if (confirm == true) {
      _list.removeWhere((e)=>e.id==p.id);
      await StorageService.savePatients(_list);
      await _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("All Patients"),
      ),
      body: _loading ? Center(child: CircularProgressIndicator()) : ListView.builder(
        padding: EdgeInsets.all(12),
        itemCount: _list.length,
        itemBuilder: (context, index) {
          final p = _list[index];
          return Dismissible(
            key: Key(p.id),
            background: Container(color: Colors.red, alignment: Alignment.centerRight, padding: EdgeInsets.only(right: 20), child: Icon(Icons.delete, color: Colors.white)),
            direction: DismissDirection.endToStart,
            confirmDismiss: (_) async {
              await _deletePatient(p);
              return false;
            },
            child: PatientTile(patient: p, onTap: () =>Navigator.push(
          context,
          MaterialPageRoute(
              builder: (context) => PatientDetailPage(patient:p))
          ).then((context) => _load()))
          );
        },
      ),
    );
  }
}

/* --------------------------
   Patient Detail Page
   --------------------------*/
class PatientDetailPage extends
StatelessWidget {
  final Patient patient;
  PatientDetailPage({required this.patient});

  @override
  Widget build(BuildContext context) {
    final image = (patient.imagePath != null && File(patient.imagePath!).existsSync())
        ? Image.file(File(patient.imagePath!), fit: BoxFit.cover)
        : Icon(Icons.person, size:120);
    return Scaffold(
      appBar: AppBar(title: Text(patient.fullName)),
      body: Padding(
        padding: EdgeInsets.all(14),
        child: Column(
          children: [
            ClipRRect(borderRadius: BorderRadius.circular(12), child: Container(height: 160, width: double.infinity, color: Colors.grey[200], child: image)),
            SizedBox(height: 12),
            InfoRow(label: "Phone", value: patient.phone),
            InfoRow(label: "Email", value: patient.email),
            InfoRow(label: "Age", value: patient.age?.toString() ?? '-'),
            InfoRow(label: "Gender", value: patient.gender ?? '-'),
            InfoRow(label: "Address", value: patient.address ?? '-'),
            InfoRow(label: "Notes", value: patient.notes ?? '-'),
          ],
        ),
      ),
    );
  }
}

class InfoRow extends StatelessWidget {
  final String label;
  final String value;
  InfoRow({required this.label, required this.value});
  @override
  Widget build(BuildContext context) {
    return ListTile(
      dense: true,
      contentPadding: EdgeInsets.zero,
      title: Text(label, style: TextStyle(fontWeight: FontWeight.bold)),
      subtitle: Text(value),
    );
  }
}

/* --------------------------
   Search Page
   --------------------------*/
class SearchPage extends StatefulWidget {
  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  List<Patient> _all = [];
  List<Patient> _res = [];
  final _q = TextEditingController();
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
    _q.addListener(_onSearch);
  }

  Future<void> _load() async {
    _all = await StorageService.loadPatients();
    _all.sort((a,b)=> b.createdAt.compareTo(a.createdAt));
    setState(() { _res = List.from(_all); _loading=false; });
  }

  void _onSearch() {
    final t = _q.text.toLowerCase().trim();
    if (t.isEmpty) setState(()=> _res = List.from(_all));
    else setState(()=> _res = _all.where((p) => p.fullName.toLowerCase().contains(t) || p.phone.toLowerCase().contains(t)).toList());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Search Patients"),
      ),
      body: Column(
        children: [
          Padding(
            padding: EdgeInsets.all(12),
            child: TextField(controller: _q, decoration: InputDecoration(prefixIcon: Icon(Icons.search), hintText: "Name or phone")),
          ),
          Expanded(
            child: _loading ? Center(child: CircularProgressIndicator()) : ListView.builder(
              padding: EdgeInsets.all(12),
              itemCount: _res.length,
              itemBuilder: (context, idx) {
                final p = _res[idx];
                return PatientTile(patient: p, onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => PatientDetailPage(patient: p))));
              },
            ),
          ),
        ],
      ),
    );
  }
}
/* --------------------------
   Settings Page
   --------------------------*/
class SettingsPage extends StatefulWidget {
  final Function(ThemeMode) onThemeChange;
  final ThemeMode currentTheme;
  SettingsPage({required this.onThemeChange, required this.currentTheme});
  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  bool _exporting = false;
  bool _importing = false;

  Future<void> _exportData() async {
    setState(()=>_exporting=true);
    try {
      final file = await StorageService.exportToFile();
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Exported to ${file.path}")));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Export failed: $e")));
    }
    setState(()=>_exporting=false);
  }

  Future<void> _importData() async {
    setState(()=>_importing=true);
    try {
      final result = await FilePicker.platform.pickFiles(type: FileType.custom, allowedExtensions: ['json']);
      if (result != null && result.files.single.path != null) {
        final file = File(result.files.single.path!);
        await StorageService.importFromFile(file);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Import completed")));
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Import failed: $e")));
    }
    setState(()=>_importing=false);
  }

  Future<void> _clearAll() async {
    final confirm = await showDialog<bool>(context: context, builder: (_) => AlertDialog(
      title: Text("Clear All Data"),
      content: Text("This will delete all patients. Continue?"),
      actions: [
        TextButton(onPressed: ()=>Navigator.pop(context,false), child: Text("No")),
        TextButton(onPressed: ()=>Navigator.pop(context,true), child: Text("Yes")),
      ],
    ));
    if (confirm == true) {
      await StorageService.clearAll();
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("All data cleared")));
    }
  }

  void _showAppInfo() {
    showAboutDialog(context: context, applicationName: "Dr. Assistant", applicationVersion: "1.0.0", children: [Text("Designed by Api")]);
  }

  void _signOut() {
    // For now sign out just shows dialog and returns to previous (no auth implemented)
    showDialog(context: context, builder: (_) => AlertDialog(
      title: Text("Sign out"),
      content: Text("Sign out of your account?"),
      actions: [
        TextButton(onPressed: ()=>Navigator.pop(context), child: Text("No")),
        TextButton(onPressed: (){
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Signed out")));
        }, child: Text("Yes")),
      ],
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Settings & Data Management"),
      ),
      body: ListView(
        children: [
          ListTile(
            title: Text("Appearance"),
            subtitle: Text("Light / Dark theme"),
          ),
          RadioListTile<ThemeMode>(
            title: Text("Light"),
            value: ThemeMode.light,
            groupValue: widget.currentTheme,
            onChanged: (v) => widget.onThemeChange(v!),
          ),
          RadioListTile<ThemeMode>(
            title: Text("Dark"),
            value: ThemeMode.dark,
            groupValue: widget.currentTheme,
            onChanged: (v) => widget.onThemeChange(v!),
          ),
          Divider(),
          ListTile(
            title: Text("Export Data"),
            subtitle: Text("Export patients to JSON file"),
            trailing: _exporting ? CircularProgressIndicator() : Icon(Icons.upload_file),
            onTap: _exporting ? null : _exportData,
          ),
          ListTile(
            title: Text("Import Data"),
            subtitle: Text("Import patients from JSON file"),
            trailing: _importing ? CircularProgressIndicator() : Icon(Icons.download),
            onTap: _importing ? null : _importData,
          ),
          ListTile(
            title: Text("Clear All Data"),
            subtitle: Text("Delete all patients stored locally"),
            trailing: Icon(Icons.delete_forever),
            onTap: _clearAll,
          ),
          Divider(),
          ListTile(
            title: Text("App Information"),
            onTap: _showAppInfo,
            leading: Icon(Icons.info),
          ),
          ListTile(
            title: Text("Help & Support"),
            onTap: () => showDialog(context: context, builder: (_) => AlertDialog(title: Text("Help"), content: Text("For help, contact: example@example.com"), actions: [TextButton(onPressed: ()=>Navigator.pop(context), child: Text("OK"))])),
            leading: Icon(Icons.help_center),
          ),
          ListTile(
            title: Text("Account (Sign out)"),
            onTap: _signOut,
            leading: Icon(Icons.logout),
          ),
        ],
      ),
    );
  }
}