import { useState } from 'react';
import { useStore, useTheme } from './useStore';
import { useAuth } from './useAuth';
import LoginScreen from './LoginScreen';
import AssistantView from './AssistantView';
import Sidebar, { NavPage } from './Sidebar';
import TasksPage from './TasksPage';
import PricingPage from './PricingPage';
import SettingsPage from './SettingsPage';
import CalendarPage from './CalendarPage';
import { AppUser } from './types';

// ══════════════════════════════════════════════════════════════════
// ADMIN APP
// ══════════════════════════════════════════════════════════════════
function AdminApp({ store, auth, theme, onToggleTheme }: {
  store: ReturnType<typeof useStore>;
  auth: ReturnType<typeof useAuth>;
  theme: ReturnType<typeof useTheme>[0];
  onToggleTheme: () => void;
}) {
  const [activePage, setActivePage] = useState<NavPage>('tasks');
  const { currentUser, users } = auth;
  const assistants = users.filter(u => u.role === 'assistant');
  const assignableUsers = users.map(u => u.id === currentUser?.id ? { ...u, displayName: 'Me' } : u);

  return (
    <div className="app">
      <div className="bg-layer" aria-hidden="true">
        <div className="glow g1" /><div className="glow g2" /><div className="glow g3" />
        <div className="grid-overlay" />
      </div>

      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        displayName={currentUser?.displayName || currentUser?.username || ''}
        onLogout={auth.logout}
        fbReady={store.fbReady}
        fbError={store.fbError}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <div className="page-content">
        {activePage === 'tasks' && (
          <TasksPage
            projects={store.projects}
            standaloneTasks={store.standaloneTasks}
            assignableUsers={assignableUsers}
            onAddProject={store.addProject}
            onDeleteProject={store.deleteProject}
            onUpdateProject={store.updateProject}
            onArchiveProject={store.archiveProject}
            onUnarchiveProject={store.unarchiveProject}
            onAddProjectTask={store.addProjectTask}
            onToggleProjectTask={store.toggleProjectTask}
            onDeleteProjectTask={store.deleteProjectTask}
            onEditProjectTask={store.editProjectTask}
            onAssignProjectTask={(pid, tid, userId) => store.editProjectTask(pid, tid, { assignedTo: userId })}
            onAddProjectSub={store.addProjectSubTask}
            onToggleProjectSub={store.toggleProjectSubTask}
            onDeleteProjectSub={store.deleteProjectSubTask}
            onAddStandaloneTask={store.addStandaloneTask}
            onToggleStandaloneTask={store.toggleStandaloneTask}
            onDeleteStandaloneTask={store.deleteStandaloneTask}
            onEditStandaloneTask={store.editStandaloneTask}
            onAssignStandaloneTask={(tid, userId) => store.editStandaloneTask(tid, { assignedTo: userId })}
            onAddStandaloneSub={store.addStandaloneSubTask}
            onToggleStandaloneSub={store.toggleStandaloneSubTask}
            onDeleteStandaloneSub={store.deleteStandaloneSubTask}
          />
        )}

        {activePage === 'calendar' && currentUser && (
          <CalendarPage
            events={store.calendarEvents}
            currentUser={currentUser}
            onAddEvent={store.addCalendarEvent}
            onUpdateEvent={store.updateCalendarEvent}
            onDeleteEvent={store.deleteCalendarEvent}
          />
        )}

        {activePage === 'pricing' && (
          <PricingPage
            items={store.priceList}
            assistants={assistants}
            mode="admin"
            onAdd={store.addPriceItem}
            onUpdate={store.updatePriceItem}
            onDelete={store.deletePriceItem}
          />
        )}

        {activePage === 'settings' && currentUser && (
          <SettingsPage
            users={users}
            currentUserId={currentUser.id}
            theme={theme}
            onToggleTheme={onToggleTheme}
            fbReady={store.fbReady}
            fbError={store.fbError}
            onAddUser={auth.addUser}
            onDeleteUser={auth.deleteUser}
            onChangePin={auth.changePin}
            onUpdatePermissions={auth.updateUserPermissions}
          />
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// APP ROOT
// ══════════════════════════════════════════════════════════════════
export default function App() {
  const store = useStore();
  const auth = useAuth();
  const [theme, toggleTheme] = useTheme();

  if (auth.isLoading) {
    return (
      <div className="app-loading">
        <div className="bg-layer" aria-hidden="true">
          <div className="glow g1" /><div className="glow g2" /><div className="glow g3" />
          <div className="grid-overlay" />
        </div>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!auth.currentUser) {
    return <LoginScreen onLogin={auth.login} error={auth.authError} />;
  }

  const currentUser: AppUser = auth.currentUser;

  if (currentUser.role === 'admin') {
    return <AdminApp store={store} auth={auth} theme={theme} onToggleTheme={toggleTheme} />;
  }

  const assistants = auth.users.filter(u => u.role === 'assistant');

  return (
    <AssistantView
      currentUser={currentUser}
      projects={store.projects}
      standaloneTasks={store.standaloneTasks}
      priceList={store.priceList}
      allAssistants={assistants}
      calendarEvents={store.calendarEvents}
      onLogout={auth.logout}
      theme={theme}
      onToggleTheme={toggleTheme}
      onToggleProjectTask={store.toggleProjectTask}
      onToggleProjectSub={store.toggleProjectSubTask}
      onToggleStandaloneTask={store.toggleStandaloneTask}
      onToggleStandaloneSub={store.toggleStandaloneSubTask}
      onAddCalendarEvent={store.addCalendarEvent}
      onUpdateCalendarEvent={store.updateCalendarEvent}
      onDeleteCalendarEvent={store.deleteCalendarEvent}
    />
  );
}
