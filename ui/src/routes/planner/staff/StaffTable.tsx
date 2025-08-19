import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronUp, 
  ChevronDown, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Search,
  Users,
  Award,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Staff } from '../../../lib/hooks/staff';
import { motionPresets } from '../../../lib/motion';

interface StaffTableProps {
  staff: Staff[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onEdit: (staff: Staff) => void;
  onDelete: (staff: Staff) => void;
  onNew: () => void;
}

type SortField = 'fullName' | 'job.name' | 'gradeBand' | 'contractHoursPerWeek' | 'active';
type SortOrder = 'asc' | 'desc';

const StaffTable: React.FC<StaffTableProps> = ({
  staff,
  isLoading,
  searchTerm,
  onSearchChange,
  onEdit,
  onDelete,
  onNew,
}) => {
  const [sortField, setSortField] = useState<SortField>('fullName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Debounced search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Sorted and filtered data
  const sortedStaff = useMemo(() => {
    return [...staff].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'fullName':
          aValue = a.fullName.toLowerCase();
          bValue = b.fullName.toLowerCase();
          break;
        case 'job.name':
          aValue = a.job.name.toLowerCase();
          bValue = b.job.name.toLowerCase();
          break;
        case 'gradeBand':
          aValue = a.gradeBand?.toLowerCase() || '';
          bValue = b.gradeBand?.toLowerCase() || '';
          break;
        case 'contractHoursPerWeek':
          aValue = a.contractHoursPerWeek;
          bValue = b.contractHoursPerWeek;
          break;
        case 'active':
          aValue = a.active ? 1 : 0;
          bValue = b.active ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [staff, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedStaff.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedStaff = sortedStaff.slice(startIndex, endIndex);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 text-neutral-400" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-primary-600" />
    ) : (
      <ChevronDown className="w-4 h-4 text-primary-600" />
    );
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-neutral-600">Loading staff...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search staff..."
            className="input pl-9"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            data-testid="staff-search"
          />
        </div>
        <button
          onClick={onNew}
          className="btn-primary"
          data-testid="staff-new"
        >
          <Users className="w-4 h-4 mr-2" />
          New Staff
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="staff-table">
            <thead className="bg-neutral-50 border-b border-neutral-200 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('fullName')}
                    className="flex items-center space-x-1 hover:text-neutral-700 transition-colors"
                  >
                    <span>Name</span>
                    <SortIcon field="fullName" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('job.name')}
                    className="flex items-center space-x-1 hover:text-neutral-700 transition-colors"
                  >
                    <span>Job</span>
                    <SortIcon field="job.name" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('gradeBand')}
                    className="flex items-center space-x-1 hover:text-neutral-700 transition-colors"
                  >
                    <span>Grade</span>
                    <SortIcon field="gradeBand" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('contractHoursPerWeek')}
                    className="flex items-center space-x-1 hover:text-neutral-700 transition-colors"
                  >
                    <span>Contract</span>
                    <SortIcon field="contractHoursPerWeek" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('active')}
                    className="flex items-center space-x-1 hover:text-neutral-700 transition-colors"
                  >
                    <span>Status</span>
                    <SortIcon field="active" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Wards
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Skills
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {paginatedStaff.map((staffMember, index) => (
                <motion.tr
                  key={staffMember.id}
                  className={`hover:bg-neutral-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-neutral-50'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-neutral-900">
                        {staffMember.fullName}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900">
                      {staffMember.job.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900">
                      {staffMember.gradeBand || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-neutral-900">
                      <Clock className="w-4 h-4 mr-1 text-neutral-400" />
                      {staffMember.contractHoursPerWeek}h/wk
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      staffMember.active 
                        ? 'bg-success-100 text-success-800' 
                        : 'bg-neutral-100 text-neutral-800'
                    }`}>
                      {staffMember.active ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {staffMember.wards.length > 0 ? (
                        staffMember.wards.slice(0, 2).map((ward) => (
                          <span
                            key={ward.id}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                          >
                            {ward.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-neutral-500">-</span>
                      )}
                      {staffMember.wards.length > 2 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
                          +{staffMember.wards.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {staffMember.skills.length > 0 ? (
                        staffMember.skills.slice(0, 2).map((skill) => (
                          <span
                            key={skill.id}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-800"
                          >
                            {skill.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-neutral-500">-</span>
                      )}
                      {staffMember.skills.length > 2 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
                          +{staffMember.skills.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onEdit(staffMember)}
                        className="p-1 text-neutral-400 hover:text-primary-600 transition-colors"
                        title="Edit staff member"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(staffMember)}
                        className="p-1 text-neutral-400 hover:text-error-600 transition-colors"
                        title="Delete staff member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-700">
                Showing {startIndex + 1} to {Math.min(endIndex, sortedStaff.length)} of {sortedStaff.length} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-neutral-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
                >
                  Previous
                </button>
                <span className="text-sm text-neutral-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-neutral-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffTable;
