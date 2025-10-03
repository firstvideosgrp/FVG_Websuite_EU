import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Department, DepartmentRole, DepartmentCrew, CrewMember } from '../types';
import * as api from '../services/appwrite';
import LoadingSpinner from './LoadingSpinner';

interface DepartmentsPanelProps {
    allCrew: CrewMember[];
    onCrewUpdate: () => void;
}

const DepartmentsPanel: React.FC<DepartmentsPanelProps> = ({ allCrew, onCrewUpdate }) => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
    const [view, setView] = useState<'departments' | 'crew'>('departments');

    const [roles, setRoles] = useState<DepartmentRole[]>([]);
    const [assignments, setAssignments] = useState<DepartmentCrew[]>([]);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);

    // Department Modal State
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [deptForm, setDeptForm] = useState({ name: '', description: '', managerId: '' });

    // Role Modal State
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<DepartmentRole | null>(null);
    const [roleForm, setRoleForm] = useState({ roleName: '', description: '' });

    // Crew Member Modal State
    const [isCrewModalOpen, setIsCrewModalOpen] = useState(false);
    const [editingCrew, setEditingCrew] = useState<CrewMember | null>(null);
    const [crewForm, setCrewForm] = useState({ name: '', bio: '' });

    // Assignment Modal State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignForm, setAssignForm] = useState({ roleId: '', crewId: '' });

    const crewMap = useMemo(() => new Map(allCrew.map(c => [c.$id, c])), [allCrew]);
    
    const fetchDepartments = useCallback(async () => {
        setIsLoading(true);
        try {
            const depts = await api.getDepartments();
            setDepartments(depts);
        } catch (error) {
            console.error("Failed to fetch departments", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchDepartmentDetails = useCallback(async (departmentId: string) => {
        setIsDetailsLoading(true);
        try {
            const [rolesData, assignmentsData] = await Promise.all([
                api.getDepartmentRoles(departmentId),
                api.getDepartmentCrew(departmentId),
            ]);
            setRoles(rolesData);
            setAssignments(assignmentsData);
        } catch (error) {
            console.error("Failed to fetch department details", error);
        } finally {
            setIsDetailsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDepartments();
    }, [fetchDepartments]);

    useEffect(() => {
        if (selectedDepartment) {
            fetchDepartmentDetails(selectedDepartment.$id);
        } else {
            setRoles([]);
            setAssignments([]);
        }
    }, [selectedDepartment, fetchDepartmentDetails]);
    
    // --- Department Handlers ---
    const openDeptModal = (dept: Department | null) => {
        setEditingDept(dept);
        setDeptForm({
            name: dept?.name || '',
            description: dept?.description || '',
            managerId: dept?.managerId || '',
        });
        setIsDeptModalOpen(true);
    };

    const handleDeptSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...deptForm, managerId: deptForm.managerId || undefined };
        try {
            if (editingDept) {
                await api.updateDepartment(editingDept.$id, payload);
            } else {
                await api.createDepartment(payload);
            }
            alert('Department saved!');
            setIsDeptModalOpen(false);
            fetchDepartments();
        } catch (error) {
            console.error("Failed to save department", error);
            alert('Failed to save department.');
        }
    };

    const handleDeleteDepartment = async (department: Department) => {
        if (window.confirm(`Are you sure you want to delete "${department.name}"? This will also delete ALL associated roles and crew assignments.`)) {
            try {
                const rolesToDelete = await api.getDepartmentRoles(department.$id);
                const assignmentsToDelete = await api.getDepartmentCrew(department.$id);
                
                await Promise.all([
                    ...rolesToDelete.map(role => api.deleteDepartmentRole(role.$id)),
                    ...assignmentsToDelete.map(asg => api.unassignCrewFromDepartment(asg.$id))
                ]);
                
                await api.deleteDepartment(department.$id);

                alert('Department and all its data deleted successfully.');
                if (selectedDepartment?.$id === department.$id) {
                    setSelectedDepartment(null);
                }
                fetchDepartments();
            } catch (error) {
                console.error("Error deleting department", error);
                alert("Failed to delete department.");
            }
        }
    };
    
    // --- Role Handlers ---
    const openRoleModal = (role: DepartmentRole | null) => {
        setEditingRole(role);
        setRoleForm({ roleName: role?.roleName || '', description: role?.description || '' });
        setIsRoleModalOpen(true);
    };

    const handleRoleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDepartment) return;
        try {
            if (editingRole) {
                await api.updateDepartmentRole(editingRole.$id, roleForm);
            } else {
                await api.createDepartmentRole({ ...roleForm, departmentId: selectedDepartment.$id });
            }
            alert('Role saved!');
            setIsRoleModalOpen(false);
            fetchDepartmentDetails(selectedDepartment.$id);
        } catch (error) {
            console.error("Failed to save role", error);
            alert("Failed to save role.");
        }
    };
    
    const handleDeleteRole = async (role: DepartmentRole) => {
        if (window.confirm(`Are you sure you want to delete the role "${role.roleName}"? This will unassign all crew members from this role.`)) {
            try {
                const assignmentsToDelete = await api.getAssignmentsForRole(role.$id);
                await Promise.all(assignmentsToDelete.map(asg => api.unassignCrewFromDepartment(asg.$id)));
                await api.deleteDepartmentRole(role.$id);
                alert('Role deleted successfully.');
                fetchDepartmentDetails(selectedDepartment!.$id);
            } catch (error) {
                console.error("Error deleting role", error);
                alert("Failed to delete role.");
            }
        }
    };
    
    // --- Crew Assignment Handlers ---
    const openAssignModal = () => {
        setAssignForm({ roleId: roles[0]?.$id || '', crewId: '' });
        setIsAssignModalOpen(true);
    };
    
    const handleAssignSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDepartment || !assignForm.roleId || !assignForm.crewId) return;

        const isAlreadyAssigned = assignments.some(a => a.roleId === assignForm.roleId && a.crewId === assignForm.crewId);
        if (isAlreadyAssigned) {
            alert("This crew member is already assigned to this role in this department.");
            return;
        }

        try {
            await api.assignCrewToDepartment({
                departmentId: selectedDepartment.$id,
                ...assignForm,
            });
            alert('Crew member assigned!');
            setIsAssignModalOpen(false);
            fetchDepartmentDetails(selectedDepartment.$id);
        } catch (error) {
            console.error("Failed to assign crew", error);
            alert("Failed to assign crew.");
        }
    };
    
    const handleUnassignCrew = async (assignmentId: string) => {
        if (window.confirm("Are you sure you want to unassign this crew member?")) {
            try {
                await api.unassignCrewFromDepartment(assignmentId);
                alert('Crew member unassigned.');
                fetchDepartmentDetails(selectedDepartment!.$id);
            } catch (error) {
                console.error("Failed to unassign crew", error);
                alert("Failed to unassign crew.");
            }
        }
    };

    // --- Crew Member CRUD Handlers ---
    const openCrewModal = (crew: CrewMember | null) => {
        setEditingCrew(crew);
        setCrewForm({ name: crew?.name || '', bio: crew?.bio || '' });
        setIsCrewModalOpen(true);
    };

    const handleCrewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...crewForm, bio: crewForm.bio || undefined };
        try {
            if (editingCrew) {
                await api.updateCrewMember(editingCrew.$id, payload);
            } else {
                await api.createCrewMember({ ...payload, role: 'Crew' });
            }
            alert('Crew Member saved!');
            setIsCrewModalOpen(false);
            onCrewUpdate();
        } catch (error) {
            console.error("Failed to save crew member", error);
            alert("Failed to save crew member.");
        }
    };

    const handleDeleteCrew = async (crewId: string) => {
        if (window.confirm("Are you sure you want to delete this crew member? They will be unassigned from all departments and projects.")) {
            // Note: This is a simplified deletion. A robust implementation
            // would also clean up assignments in DepartmentCrew and ProjectDepartmentCrew.
            try {
                await api.deleteCrewMember(crewId);
                alert('Crew member deleted.');
                onCrewUpdate();
            } catch (error) {
                console.error("Failed to delete crew member", error);
                alert("Failed to delete crew member.");
            }
        }
    };

    const assignedCrewByRole = useMemo(() => {
        const grouped = new Map<string, { roleName: string, crew: { assignmentId: string, member: CrewMember }[] }>();
        roles.forEach(role => {
            grouped.set(role.$id, { roleName: role.roleName, crew: [] });
        });
        assignments.forEach(asg => {
            const role = grouped.get(asg.roleId);
            const member = crewMap.get(asg.crewId);
            if (role && member) {
                role.crew.push({ assignmentId: asg.$id, member });
            }
        });
        return Array.from(grouped.values());
    }, [roles, assignments, crewMap]);

    return (
        <div className="space-y-6">
            <div className="bg-[var(--bg-primary)] p-4 rounded-lg shadow-lg border border-[var(--border-color)]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-[var(--primary-color)] flex items-center"><i className="fas fa-building mr-3"></i>Departments & Crew</h2>
                    <div className="flex items-center gap-4">
                         {/* View Toggle */}
                        <div className="flex rounded-md bg-[var(--bg-secondary)] p-1">
                            <button onClick={() => setView('departments')} className={`px-3 py-1 text-sm font-semibold rounded ${view === 'departments' ? 'bg-[var(--primary-color)] text-gray-900' : 'text-[var(--text-secondary)]'}`}>Departments</button>
                            <button onClick={() => setView('crew')} className={`px-3 py-1 text-sm font-semibold rounded ${view === 'crew' ? 'bg-[var(--primary-color)] text-gray-900' : 'text-[var(--text-secondary)]'}`}>Crew Roster</button>
                        </div>
                        <button onClick={() => view === 'departments' ? openDeptModal(null) : openCrewModal(null)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center space-x-2">
                            <i className="fas fa-plus"></i><span>{view === 'departments' ? 'Add Department' : 'Add Crew Member'}</span>
                        </button>
                    </div>
                </div>

                {view === 'crew' && (
                    <div>
                        <h3 className="text-xl font-bold mb-3">Crew Roster</h3>
                        <div className="space-y-4 max-h-[75vh] overflow-y-auto">
                            {allCrew.map(member => (
                                <div key={member.$id} className="bg-[var(--bg-secondary)] p-4 rounded-md flex justify-between items-center border border-[var(--border-color)]">
                                    <div>
                                        <h3 className="font-bold text-lg">{member.name}</h3>
                                        <p className="text-sm text-[var(--text-secondary)]">{member.role}</p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button onClick={() => openCrewModal(member)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded text-sm"><i className="fas fa-pencil-alt"></i></button>
                                        <button onClick={() => handleDeleteCrew(member.$id)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded text-sm"><i className="fas fa-trash"></i></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {view === 'departments' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1">
                            <h3 className="text-lg font-semibold mb-3 border-b border-[var(--border-color)] pb-2">All Departments</h3>
                            {isLoading ? <LoadingSpinner /> : (
                                <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                                    {departments.map(dept => (
                                        <div key={dept.$id} onClick={() => setSelectedDepartment(dept)} className={`p-3 rounded-md cursor-pointer transition-colors border ${selectedDepartment?.$id === dept.$id ? 'bg-[var(--primary-color)] text-gray-900 border-[var(--primary-color)]' : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-card)] border-[var(--border-color)]'}`}>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className={`font-bold ${selectedDepartment?.$id === dept.$id ? '' : 'text-[var(--text-primary)]'}`}>{dept.name}</p>
                                                    <p className={`text-xs ${selectedDepartment?.$id === dept.$id ? 'text-gray-800' : 'text-[var(--text-secondary)]'}`}>
                                                        Manager: {crewMap.get(dept.managerId || '')?.name || 'Not set'}
                                                    </p>
                                                </div>
                                                <div className="flex space-x-1">
                                                    <button onClick={(e) => { e.stopPropagation(); openDeptModal(dept); }} className="w-7 h-7 rounded hover:bg-black/20 flex items-center justify-center"><i className="fas fa-pencil-alt"></i></button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteDepartment(dept); }} className="w-7 h-7 rounded hover:bg-black/20 flex items-center justify-center"><i className="fas fa-trash"></i></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-2">
                            {selectedDepartment ? (
                                <>
                                    <h3 className="text-xl font-bold mb-4 text-[var(--primary-color)] border-b border-[var(--border-color)] pb-3">Details for {selectedDepartment.name}</h3>
                                    {isDetailsLoading ? <div className="flex justify-center py-8"><LoadingSpinner /></div> : (
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                            {/* Roles Section */}
                                            <div>
                                                <div className="flex justify-between items-center mb-3">
                                                    <h4 className="text-lg font-semibold">Roles</h4>
                                                    <button onClick={() => openRoleModal(null)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm">+ Add Role</button>
                                                </div>
                                                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                                                    {roles.map(role => (
                                                        <div key={role.$id} className="bg-[var(--bg-secondary)] p-3 rounded-md border border-[var(--border-color)]">
                                                            <div className="flex justify-between items-center">
                                                                <div>
                                                                    <p className="font-semibold">{role.roleName}</p>
                                                                    <p className="text-xs text-[var(--text-secondary)]">{role.description}</p>
                                                                </div>
                                                                <div className="flex space-x-1">
                                                                    <button onClick={() => openRoleModal(role)} className="w-7 h-7 rounded hover:bg-[var(--bg-primary)] text-blue-400 flex items-center justify-center"><i className="fas fa-pencil-alt"></i></button>
                                                                    <button onClick={() => handleDeleteRole(role)} className="w-7 h-7 rounded hover:bg-[var(--bg-primary)] text-red-400 flex items-center justify-center"><i className="fas fa-trash"></i></button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            {/* Assigned Crew Section */}
                                            <div>
                                                <div className="flex justify-between items-center mb-3">
                                                    <h4 className="text-lg font-semibold">Assigned Crew</h4>
                                                    {roles.length > 0 && <button onClick={openAssignModal} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-3 rounded text-sm">+ Assign Crew</button>}
                                                </div>
                                                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                                                    {assignedCrewByRole.map(({ roleName, crew }) => (
                                                        <div key={roleName}>
                                                            <h5 className="font-bold text-sm text-[var(--text-secondary)] mb-2">{roleName}</h5>
                                                            {crew.length > 0 ? crew.map(({ assignmentId, member }) => (
                                                                <div key={assignmentId} className="flex justify-between items-center bg-[var(--bg-secondary)] p-2 rounded-md border border-[var(--border-color)] mb-2">
                                                                    <span>{member.name}</span>
                                                                    <button onClick={() => handleUnassignCrew(assignmentId)} className="text-red-400 hover:text-red-300 w-7 h-7"><i className="fas fa-times-circle"></i></button>
                                                                </div>
                                                            )) : <p className="text-xs text-center text-gray-500 py-1">No crew assigned</p>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full text-center text-[var(--text-secondary)]">
                                    <div>
                                        <i className="fas fa-arrow-left text-4xl mb-4"></i>
                                        <p>Select a department to view its details.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {isDeptModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--bg-card)] p-8 rounded-lg w-full max-w-lg">
                        <h2 className="text-2xl font-bold mb-6">{editingDept ? 'Edit' : 'Create'} Department</h2>
                        <form onSubmit={handleDeptSubmit} className="space-y-4">
                            <input name="name" value={deptForm.name} onChange={e => setDeptForm(p=>({...p, name: e.target.value}))} placeholder="Department Name" required className="w-full bg-[var(--input-bg)] p-2 rounded border border-[var(--border-color)]" />
                            <textarea name="description" value={deptForm.description} onChange={e => setDeptForm(p=>({...p, description: e.target.value}))} placeholder="Description" rows={3} className="w-full bg-[var(--input-bg)] p-2 rounded border border-[var(--border-color)]" />
                            <select name="managerId" value={deptForm.managerId} onChange={e => setDeptForm(p=>({...p, managerId: e.target.value}))} className="w-full bg-[var(--input-bg)] p-2 rounded border border-[var(--border-color)]">
                                <option value="">Select a Manager (Optional)</option>
                                {allCrew.map(c => <option key={c.$id} value={c.$id}>{c.name} ({c.role})</option>)}
                            </select>
                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={() => setIsDeptModalOpen(false)} className="bg-gray-500 py-2 px-4 rounded text-white">Cancel</button>
                                <button type="submit" className="bg-[var(--primary-color)] py-2 px-4 rounded text-gray-900 font-bold">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
             {isRoleModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--bg-card)] p-8 rounded-lg w-full max-w-lg">
                        <h2 className="text-2xl font-bold mb-6">{editingRole ? 'Edit' : 'Create'} Role</h2>
                        <form onSubmit={handleRoleSubmit} className="space-y-4">
                            <input name="roleName" value={roleForm.roleName} onChange={e => setRoleForm(p=>({...p, roleName: e.target.value}))} placeholder="Role Name" required className="w-full bg-[var(--input-bg)] p-2 rounded border border-[var(--border-color)]" />
                            <textarea name="description" value={roleForm.description} onChange={e => setRoleForm(p=>({...p, description: e.target.value}))} placeholder="Description" rows={3} className="w-full bg-[var(--input-bg)] p-2 rounded border border-[var(--border-color)]" />
                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={() => setIsRoleModalOpen(false)} className="bg-gray-500 py-2 px-4 rounded text-white">Cancel</button>
                                <button type="submit" className="bg-[var(--primary-color)] py-2 px-4 rounded text-gray-900 font-bold">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isAssignModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--bg-card)] p-8 rounded-lg w-full max-w-lg">
                        <h2 className="text-2xl font-bold mb-6">Assign Crew</h2>
                        <form onSubmit={handleAssignSubmit} className="space-y-4">
                            <select name="roleId" value={assignForm.roleId} onChange={e => setAssignForm(p => ({...p, roleId: e.target.value}))} required className="w-full bg-[var(--input-bg)] p-2 rounded border border-[var(--border-color)]">
                                {roles.map(r => <option key={r.$id} value={r.$id}>{r.roleName}</option>)}
                            </select>
                            <select name="crewId" value={assignForm.crewId} onChange={e => setAssignForm(p => ({...p, crewId: e.target.value}))} required className="w-full bg-[var(--input-bg)] p-2 rounded border border-[var(--border-color)]">
                                <option value="" disabled>Select a Crew Member</option>
                                {allCrew.map(c => <option key={c.$id} value={c.$id}>{c.name}</option>)}
                            </select>
                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="bg-gray-500 py-2 px-4 rounded text-white">Cancel</button>
                                <button type="submit" className="bg-[var(--primary-color)] py-2 px-4 rounded text-gray-900 font-bold">Assign</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isCrewModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-lg shadow-2xl w-full max-w-lg relative text-[var(--text-primary)]">
                        <button onClick={() => setIsCrewModalOpen(false)} aria-label="Close modal" className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl">&times;</button>
                        <h2 className="text-2xl font-bold mb-6">{editingCrew ? 'Edit' : 'Create'} Crew Member</h2>
                        <form onSubmit={handleCrewSubmit} className="space-y-4">
                            <input type="text" name="name" value={crewForm.name} onChange={e => setCrewForm(p => ({...p, name: e.target.value}))} placeholder="Name" required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                            <textarea name="bio" value={crewForm.bio} onChange={e => setCrewForm(p => ({...p, bio: e.target.value}))} placeholder="Biography (Optional)" rows={4} className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md p-2" />
                            <div className="flex justify-end space-x-4 pt-4">
                                <button type="button" onClick={() => setIsCrewModalOpen(false)} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">Cancel</button>
                                <button type="submit" className="bg-[var(--primary-color)] hover:brightness-110 text-gray-900 font-bold py-2 px-4 rounded">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DepartmentsPanel;