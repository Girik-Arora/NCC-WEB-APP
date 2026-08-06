'use client';

import { useEffect, useState, useRef } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getCadetProfile, saveCadetProfile } from '@/lib/db';
import type { CadetProfile } from '@/types';
import toast from 'react-hot-toast';
import { Save, User, Phone, AlertTriangle, Heart, AlertCircle } from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const BRANCHES = ['Army', 'Navy', 'Air Force'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const GENDERS = ['Male', 'Female', 'Other'];

const STATE_CITIES: Record<string, string[]> = {
  "Andaman and Nicobar Islands": ["Port Blair"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Tirupati"],
  "Arunachal Pradesh": ["Itanagar", "Tawang"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Tezpur"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia"],
  "Chandigarh": ["Chandigarh"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Diu", "Silvassa"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"],
  "Haryana": ["Faridabad", "Gurugram", "Panipat", "Ambala", "Rohtak"],
  "Himachal Pradesh": ["Shimla", "Dharamshala", "Manali", "Mandi", "Solan"],
  "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hubballi", "Mangaluru", "Belagavi"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"],
  "Ladakh": ["Leh", "Kargil"],
  "Lakshadweep": ["Kavaratti"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Aurangabad", "Navi Mumbai"],
  "Manipur": ["Imphal"],
  "Meghalaya": ["Shillong", "Cherrapunji"],
  "Mizoram": ["Aizawl"],
  "Nagaland": ["Kohima", "Dimapur"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Puri", "Sambalpur"],
  "Puducherry": ["Puducherry", "Oulgaret", "Karaikal"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner"],
  "Sikkim": ["Gangtok"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
  "Tripura": ["Agartala"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Noida", "Ghaziabad", "Prayagraj"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Rishikesh", "Haldwani"],
  "West Bengal": ["Kolkata", "Asansol", "Siliguri", "Durgapur", "Howrah"]
};
export default function ProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState<Partial<CadetProfile>>({
    firstName: '', lastName: '', rollNumber: '', branch: 'Army',
    college: '', semester: 1, bloodGroup: 'O+', dateOfBirth: '',
    gender: 'Male', phone: '', address: '', city: '', state: '',
    emergencyName: '', emergencyRelation: '', emergencyPhone: '',
    medicalIssues: false, medicalDetails: '',
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'personal' | 'contact' | 'emergency' | 'medical'>('personal');

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;
    getCadetProfile(user.uid).then((p) => {
      if (p) setForm(p);
      setLoading(false);
    });
  }, [user]);

  const handleAutoSave = async (currentForm: Partial<CadetProfile>) => {
    if (!user) return;
    setSaving(true);
    try {
      const currentMissingFields: string[] = [];
      if (!currentForm.firstName) currentMissingFields.push('First Name');
      if (!currentForm.lastName) currentMissingFields.push('Last Name');
      if (!currentForm.rollNumber) currentMissingFields.push('Roll Number');
      if (!currentForm.college) currentMissingFields.push('College');
      if (!currentForm.dateOfBirth) currentMissingFields.push('Date of Birth');
      if (!currentForm.phone) currentMissingFields.push('Phone Number');
      if (!currentForm.address) currentMissingFields.push('Address');
      if (!currentForm.city) currentMissingFields.push('City');
      if (!currentForm.state) currentMissingFields.push('State');
      if (!currentForm.emergencyName) currentMissingFields.push('Emergency Contact Name');
      if (!currentForm.emergencyRelation) currentMissingFields.push('Emergency Contact Relation');
      if (!currentForm.emergencyPhone) currentMissingFields.push('Emergency Phone');
      if (currentForm.medicalIssues && !currentForm.medicalDetails) currentMissingFields.push('Medical Details');

      const isComplete = currentMissingFields.length === 0;
      await saveCadetProfile(user.uid, { ...currentForm, profileComplete: isComplete });
      if (isComplete && !currentForm.profileComplete) {
        toast.success('Profile completed successfully!');
      }
    } catch {
      toast.error('Failed to auto-save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof CadetProfile, value: unknown) => {
    const updatedForm = { ...form, [field]: value };
    setForm(updatedForm);
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      handleAutoSave(updatedForm);
    }, 1000);
  };

  const missingFields: string[] = [];
  if (!form.firstName) missingFields.push('First Name');
  if (!form.lastName) missingFields.push('Last Name');
  if (!form.rollNumber) missingFields.push('Roll Number');
  if (!form.college) missingFields.push('College');
  if (!form.dateOfBirth) missingFields.push('Date of Birth');
  if (!form.phone) missingFields.push('Phone Number');
  if (!form.address) missingFields.push('Address');
  if (!form.city) missingFields.push('City');
  if (!form.state) missingFields.push('State');
  if (!form.emergencyName) missingFields.push('Emergency Contact Name');
  if (!form.emergencyRelation) missingFields.push('Emergency Contact Relation');
  if (!form.emergencyPhone) missingFields.push('Emergency Phone');
  if (form.medicalIssues && !form.medicalDetails) missingFields.push('Medical Details');

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const isComplete = missingFields.length === 0;
      await saveCadetProfile(user.uid, { ...form, profileComplete: isComplete });
      if (isComplete && !form.profileComplete) {
        toast.success('Profile completed successfully!');
      } else {
        toast.success('Profile saved successfully!');
      }
    } catch {
      toast.error('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal', icon: <User size={15} /> },
    { id: 'contact', label: 'Contact', icon: <Phone size={15} /> },
    { id: 'emergency', label: 'Emergency', icon: <AlertTriangle size={15} /> },
    { id: 'medical', label: 'Medical', icon: <Heart size={15} /> },
  ] as const;

  if (loading) {
    return (
      <AppShell>
        <div style={{ height: 400, background: '#e2e8f0', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>My Profile</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Manage your personal information and contact details.</p>
        </div>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>



      {/* Tab Navigation */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24,
        background: '#f1f5f9', padding: 4, borderRadius: 10, width: 'fit-content',
      }}>
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif',
              background: activeTab === tab.id ? 'white' : 'transparent',
              color: activeTab === tab.id ? '#1e3a5f' : '#64748b',
              boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ maxWidth: 720 }}>
        {/* Personal Details */}
        {activeTab === 'personal' && (
          <div>
            <h3 style={{ fontWeight: 700, color: '#0f172a', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={18} color="#1e3a5f" /> Personal Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input className="form-input" value={form.firstName || ''} onChange={(e) => handleChange('firstName', e.target.value)} placeholder="Enter first name" />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input className="form-input" value={form.lastName || ''} onChange={(e) => handleChange('lastName', e.target.value)} placeholder="Enter last name" />
              </div>
              <div className="form-group">
                <label className="form-label">Roll Number *</label>
                <input className="form-input" value={form.rollNumber || ''} onChange={(e) => handleChange('rollNumber', e.target.value)} placeholder="e.g. 2024CSE001" />
              </div>
              <div className="form-group">
                <label className="form-label">College / Institution *</label>
                <input className="form-input" value={form.college || ''} onChange={(e) => handleChange('college', e.target.value)} placeholder="College name" />
              </div>
              <div className="form-group">
                <label className="form-label">NCC Branch</label>
                <select className="form-select" value={form.branch || 'Army'} onChange={(e) => handleChange('branch', e.target.value)}>
                  {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Current Semester</label>
                <select className="form-select" value={form.semester || 1} onChange={(e) => handleChange('semester', parseInt(e.target.value))}>
                  {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select className="form-select" value={form.bloodGroup || 'O+'} onChange={(e) => handleChange('bloodGroup', e.target.value)}>
                  {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-select" value={form.gender || 'Male'} onChange={(e) => handleChange('gender', e.target.value)}>
                  {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Date of Birth</label>
                <input className="form-input" type="date" value={form.dateOfBirth || ''} onChange={(e) => handleChange('dateOfBirth', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Contact Details */}
        {activeTab === 'contact' && (
          <div>
            <h3 style={{ fontWeight: 700, color: '#0f172a', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Phone size={18} color="#1e3a5f" /> Contact Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Phone Number *</label>
                <input className="form-input" value={form.phone || ''} onChange={(e) => handleChange('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Address</label>
                <input className="form-input" value={form.address || ''} onChange={(e) => handleChange('address', e.target.value)} placeholder="Street address" />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <select 
                  className="form-select" 
                  value={form.state || ''} 
                  onChange={(e) => {
                    const val = e.target.value;
                    const updatedForm = { ...form, state: val, city: '' };
                    setForm(updatedForm);
                    if (timeoutRef.current) clearTimeout(timeoutRef.current);
                    timeoutRef.current = setTimeout(() => handleAutoSave(updatedForm), 1000);
                  }}
                >
                  <option value="" disabled>Select State</option>
                  {Object.keys(STATE_CITIES).map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <select 
                  className="form-select" 
                  value={form.city || ''} 
                  onChange={(e) => handleChange('city', e.target.value)}
                  disabled={!form.state}
                >
                  <option value="" disabled>{form.state ? 'Select City' : 'Select State First'}</option>
                  {form.state && STATE_CITIES[form.state]?.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Emergency Contact */}
        {activeTab === 'emergency' && (
          <div>
            <h3 style={{ fontWeight: 700, color: '#0f172a', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} color="#d97706" /> Emergency Contact
            </h3>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
              This person will be contacted in case of emergency during camps.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Contact Name</label>
                <input className="form-input" value={form.emergencyName || ''} onChange={(e) => handleChange('emergencyName', e.target.value)} placeholder="Full name" />
              </div>
              <div className="form-group">
                <label className="form-label">Relationship</label>
                <input className="form-input" value={form.emergencyRelation || ''} onChange={(e) => handleChange('emergencyRelation', e.target.value)} placeholder="e.g. Father, Mother" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Emergency Phone</label>
                <input className="form-input" value={form.emergencyPhone || ''} onChange={(e) => handleChange('emergencyPhone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
              </div>
            </div>
          </div>
        )}

        {/* Medical */}
        {activeTab === 'medical' && (
          <div>
            <h3 style={{ fontWeight: 700, color: '#0f172a', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Heart size={18} color="#dc2626" /> Medical Information
            </h3>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
              Medical conditions are kept confidential and only used for camp safety screening.
            </p>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.medicalIssues || false}
                  onChange={(e) => handleChange('medicalIssues', e.target.checked)}
                  style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#1e3a5f' }}
                />
                <span style={{ fontSize: 14, color: '#0f172a', fontWeight: 500 }}>I have a medical condition that the ANO should be aware of</span>
              </label>
            </div>
            {form.medicalIssues && (
              <div className="form-group">
                <label className="form-label">Medical Details</label>
                <textarea
                  className="form-input"
                  value={form.medicalDetails || ''}
                  onChange={(e) => handleChange('medicalDetails', e.target.value)}
                  placeholder="Briefly describe your medical condition..."
                  rows={4}
                  style={{ resize: 'vertical' }}
                />
              </div>
            )}
            {!form.medicalIssues && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 16, marginTop: 8 }}>
                <p style={{ color: '#15803d', fontSize: 14 }}>✓ No medical issues declared. You are eligible for all camps.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
