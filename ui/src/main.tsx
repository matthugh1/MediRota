import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { ConfirmDialogProvider } from './components/ConfirmDialog';
import { queryClient } from './lib/query';
import './styles.css';

// Import route components
import PlannerLayout from './routes/planner/layout/PlannerLayout';
import PlannerDashboard from './routes/planner/index';
import WardsPage from './routes/planner/config/WardsPage';
import SkillsPage from './routes/planner/config/SkillsPage';
import ShiftTypesPage from './routes/planner/config/ShiftTypesPage';
import RuleSetsPage from './routes/planner/config/RuleSetsPage';
import StaffPage from './routes/planner/staff/StaffPage';
import DemandPage from './routes/planner/demand/DemandPage';
import SchedulePage from './routes/planner/schedule/SchedulePage';

// Import policy components
import PolicyList from './routes/planner/config/policy/PolicyList';
import PolicyEditor from './routes/planner/config/policy/PolicyEditor';
import PolicyAssignmentPage from './routes/admin/policy/PolicyAssignmentPage';

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<ToastProvider>
				<ConfirmDialogProvider>
					<Router>
						<Routes>
							{/* Redirect root to planner */}
							<Route path="/" element={<Navigate to="/planner" replace />} />
							
							{/* Planner routes */}
							<Route path="/planner" element={<PlannerLayout />}>
								<Route index element={<PlannerDashboard />} />
								
								{/* Config routes */}
								<Route path="config/wards" element={<WardsPage />} />
								<Route path="config/skills" element={<SkillsPage />} />
								<Route path="config/shift-types" element={<ShiftTypesPage />} />
								<Route path="config/rule-sets" element={<RuleSetsPage />} />
								<Route path="config/policy" element={<PolicyList />} />
								<Route path="config/policy/new" element={<PolicyEditor />} />
								<Route path="config/policy/:id" element={<PolicyEditor />} />
								<Route path="config/policy/:id/edit" element={<PolicyEditor />} />
								<Route path="config/policy/assignments" element={<PolicyAssignmentPage />} />
								
								{/* Staff routes */}
								<Route path="staff" element={<StaffPage />} />
								
								{/* Demand routes */}
								<Route path="demand" element={<DemandPage />} />
								
								{/* Schedule routes */}
								<Route path="schedule" element={<SchedulePage />} />
								
								{/* Add more planner routes here */}
							</Route>
							
							{/* Admin routes - placeholder */}
							<Route path="/admin" element={
								<div className="p-4">
									<h1 className="text-2xl font-bold">Admin Dashboard</h1>
									<p className="text-zinc-600">Admin functionality coming soon...</p>
								</div>
							} />
							
							{/* Staff routes - placeholder */}
							<Route path="/me" element={
								<div className="p-4">
									<h1 className="text-2xl font-bold">My Shifts</h1>
									<p className="text-zinc-600">Staff view coming soon...</p>
								</div>
							} />
							
							{/* 404 route */}
							<Route path="*" element={
								<div className="p-4">
									<h1 className="text-2xl font-bold">Page Not Found</h1>
									<p className="text-zinc-600">The page you're looking for doesn't exist.</p>
								</div>
							} />
						</Routes>
					</Router>
				</ConfirmDialogProvider>
			</ToastProvider>
		</QueryClientProvider>
	);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);

