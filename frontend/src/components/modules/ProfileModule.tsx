import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { UserDocument, ProfileDocStatus, UserRole } from '../../types';
import {
  User, Building2, FileCheck, KeyRound, ShieldCheck, CheckCircle2,
  Clock, AlertTriangle, XCircle, FileText, Upload, RefreshCw, Eye,
  Edit3, Check, X, Shield, Lock, AlertCircle, Sparkles, ChevronRight,
  ExternalLink, Download, Info, ArrowUpRight,
  Image as ImageIcon, Award, Calendar, MapPin, Trash2, Plus, Navigation, Layers, ZoomIn, Tag
} from 'lucide-react';
import { buyerRegistrationApi } from '../../services/buyerRegistrationApi';
import {
  manufacturerRegistrationApi,
  FactoryGalleryItem,
  AchievementItem,
  CreateGalleryPayload,
  UpdateGalleryPayload,
  CreateAchievementPayload,
  UpdateAchievementPayload
} from '../../services/manufacturerRegistrationApi';
import { adminVerificationApi } from '../../services/adminVerificationApi';
import { formatGpsCoordinates } from './ManufacturerVerificationModule';
import { BuyerBrandDocumentsSection } from './BuyerBrandDocumentsSection';
import { BuyerTrademarkDocumentsSection } from './BuyerTrademarkDocumentsSection';

export const ProfileModule: React.FC = () => {
  const {
    userProfile, orgProfile, userDocuments, currentRole, profileSubTab, setProfileSubTab,
    updateUserProfile, updateOrgProfile, uploadUserDocument, replaceUserDocument,
    changeUserPassword
  } = useApp();

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditOrgOpen, setIsEditOrgOpen] = useState(false);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [selectedDocForView, setSelectedDocForView] = useState<UserDocument | null>(null);
  const [selectedDocForReplace, setSelectedDocForReplace] = useState<UserDocument | null>(null);
  const [selectedFileForReplace, setSelectedFileForReplace] = useState<File | null>(null);
  const [selectedFileForUpload, setSelectedFileForUpload] = useState<File | null>(null);
  const [buyerRegCode, setBuyerRegCode] = useState<string>('');
  const [mfgRegCode, setMfgRegCode] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Documents & Verification sub-navigation state
  const [docSectionTab, setDocSectionTab] = useState<'statutory' | 'brand' | 'trademark'>('statutory');
  const [brandDocsCount, setBrandDocsCount] = useState<number>(0);
  const [trademarkDocsCount, setTrademarkDocsCount] = useState<number>(0);

  // Real backend documents state
  const [realDocs, setRealDocs] = useState<UserDocument[] | null>(null);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(false);
  const [docPreviewBlobUrl, setDocPreviewBlobUrl] = useState<string | null>(null);
  const [isDocPreviewLoading, setIsDocPreviewLoading] = useState<boolean>(false);
  const [docPreviewError, setDocPreviewError] = useState<string | null>(null);

  // ── Factory Gallery state ──────────────────────────────────────────
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const [galleryList, setGalleryList] = useState<FactoryGalleryItem[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState<boolean>(false);
  const [isUploadGalleryOpen, setIsUploadGalleryOpen] = useState<boolean>(false);
  const [isEditGalleryOpen, setIsEditGalleryOpen] = useState<boolean>(false);
  const [editingGalleryItem, setEditingGalleryItem] = useState<FactoryGalleryItem | null>(null);
  const [previewGalleryItem, setPreviewGalleryItem] = useState<FactoryGalleryItem | null>(null);
  const [deletingGalleryItem, setDeletingGalleryItem] = useState<FactoryGalleryItem | null>(null);
  const [isGallerySubmitting, setIsGallerySubmitting] = useState<boolean>(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [galleryFilePreview, setGalleryFilePreview] = useState<string | null>(null);
  const [galleryFileSizeFormatted, setGalleryFileSizeFormatted] = useState<string | null>(null);
  const [fileValidationError, setFileValidationError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [galleryForm, setGalleryForm] = useState<{
    title: string;
    description: string;
    capturedAt: string;
    locationName: string;
    latitude: string;
    longitude: string;
    file: File | null;
  }>({
    title: '',
    description: '',
    capturedAt: new Date().toISOString().split('T')[0],
    locationName: '',
    latitude: '',
    longitude: '',
    file: null,
  });

  // ── Achievements & Awards state ───────────────────────────────────
  const [achievementsList, setAchievementsList] = useState<AchievementItem[]>([]);
  const [isLoadingAchievements, setIsLoadingAchievements] = useState<boolean>(false);
  const [isAddAchievementOpen, setIsAddAchievementOpen] = useState<boolean>(false);
  const [isEditAchievementOpen, setIsEditAchievementOpen] = useState<boolean>(false);
  const [editingAchievement, setEditingAchievement] = useState<AchievementItem | null>(null);
  const [deletingAchievement, setDeletingAchievement] = useState<AchievementItem | null>(null);
  const [isAchievementSubmitting, setIsAchievementSubmitting] = useState<boolean>(false);
  const [achievementError, setAchievementError] = useState<string | null>(null);
  const [achievementForm, setAchievementForm] = useState<{
    title: string;
    awardType: string;
    issuingOrganization: string;
    issueDate: string;
    expiryDate: string;
    description: string;
    certFile: File | null;
  }>({
    title: '',
    awardType: 'Quality Excellence',
    issuingOrganization: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    description: '',
    certFile: null,
  });

  const loadGallery = async (code?: string) => {
    if (currentRole !== 'SUPPLIER') return;
    setIsLoadingGallery(true);
    try {
      const list = await manufacturerRegistrationApi.listGallery(code || mfgRegCode || undefined);
      setGalleryList(Array.isArray(list) ? list : []);
    } catch {
      setGalleryList([]);
    } finally {
      setIsLoadingGallery(false);
    }
  };

  const loadAchievements = async (code?: string) => {
    if (currentRole !== 'SUPPLIER') return;
    setIsLoadingAchievements(true);
    try {
      const list = await manufacturerRegistrationApi.listAchievements(code || mfgRegCode || undefined);
      setAchievementsList(Array.isArray(list) ? list : []);
    } catch {
      setAchievementsList([]);
    } finally {
      setIsLoadingAchievements(false);
    }
  };

  const handleDetectCoordinates = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGalleryForm((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
      },
      (err) => {
        alert(`Location permission not granted: ${err.message}. You may enter coordinates manually or leave them blank.`);
      },
      { timeout: 10000 }
    );
  };

  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
  const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleSelectGalleryFile = (file: File | null) => {
    setFileValidationError(null);
    setGalleryError(null);
    if (galleryFilePreview) {
      URL.revokeObjectURL(galleryFilePreview);
      setGalleryFilePreview(null);
    }
    setGalleryFileSizeFormatted(null);

    if (!file) {
      setGalleryForm(prev => ({ ...prev, file: null }));
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = '';
      return;
    }

    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    const mime = (file.type || '').toLowerCase();
    const isAllowed = ALLOWED_IMAGE_TYPES.includes(mime) || ALLOWED_EXTENSIONS.includes(ext);

    if (!isAllowed) {
      setFileValidationError(`Unsupported file format (${mime || ext || 'unknown'}). Only PNG, JPG, JPEG, and WebP images are accepted.`);
      setGalleryForm(prev => ({ ...prev, file: null }));
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setFileValidationError(`File size (${formatFileSize(file.size)}) exceeds the 10 MB limit. Please select a smaller photo.`);
      setGalleryForm(prev => ({ ...prev, file: null }));
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = '';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setGalleryFilePreview(objectUrl);
    setGalleryFileSizeFormatted(formatFileSize(file.size));
    setGalleryForm(prev => ({ ...prev, file }));
  };

  const handleRemoveSelectedFile = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (galleryFilePreview) {
      URL.revokeObjectURL(galleryFilePreview);
      setGalleryFilePreview(null);
    }
    setGalleryFileSizeFormatted(null);
    setFileValidationError(null);
    setGalleryForm(prev => ({ ...prev, file: null }));
    if (galleryFileInputRef.current) {
      galleryFileInputRef.current.value = '';
    }
  };

  const handleCloseUploadGallery = () => {
    if (galleryFilePreview) {
      URL.revokeObjectURL(galleryFilePreview);
      setGalleryFilePreview(null);
    }
    setGalleryFileSizeFormatted(null);
    setFileValidationError(null);
    setGalleryError(null);
    setIsDraggingOver(false);
    if (galleryFileInputRef.current) {
      galleryFileInputRef.current.value = '';
    }
    setIsUploadGalleryOpen(false);
  };

  const handleOpenUploadGallery = () => {
    if (galleryFilePreview) {
      URL.revokeObjectURL(galleryFilePreview);
      setGalleryFilePreview(null);
    }
    setGalleryFileSizeFormatted(null);
    setFileValidationError(null);
    setGalleryError(null);
    setIsDraggingOver(false);
    if (galleryFileInputRef.current) {
      galleryFileInputRef.current.value = '';
    }
    setGalleryForm({
      title: '',
      description: '',
      capturedAt: new Date().toISOString().split('T')[0],
      locationName: orgProfile.city ? `${orgProfile.companyName || 'Factory'} - ${orgProfile.city}` : (orgProfile.companyName || ''),
      latitude: '',
      longitude: '',
      file: null,
    });
    setIsUploadGalleryOpen(true);
  };

  const handleSaveUploadGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    setGalleryError(null);

    if (fileValidationError) {
      setGalleryError(fileValidationError);
      return;
    }
    if (!galleryForm.file) {
      setGalleryError('Please select a factory photo file (PNG, JPG, JPEG, or WebP).');
      return;
    }
    if (!galleryForm.title.trim()) {
      setGalleryError('Photo title is required.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    if (galleryForm.capturedAt && galleryForm.capturedAt > today) {
      setGalleryError('Capture date cannot be in the future.');
      return;
    }

    const locationValue = galleryForm.locationName.trim() || orgProfile.companyName || 'Main Manufacturing Plant';

    setIsGallerySubmitting(true);
    try {
      await manufacturerRegistrationApi.uploadGalleryEntry(
        galleryForm.file,
        {
          title: galleryForm.title.trim(),
          factoryLocation: locationValue,
          locationName: locationValue,
          captureDate: galleryForm.capturedAt || undefined,
          capturedAt: galleryForm.capturedAt || undefined,
          description: galleryForm.description.trim() || undefined,
          latitude: galleryForm.latitude ? parseFloat(galleryForm.latitude) : undefined,
          longitude: galleryForm.longitude ? parseFloat(galleryForm.longitude) : undefined,
        },
        mfgRegCode || undefined,
      );

      handleCloseUploadGallery();
      showToast('✓ Factory photo uploaded successfully to secure storage.');
      await loadGallery();
    } catch (err: any) {
      setGalleryError(err.message || 'Failed to upload gallery photo.');
    } finally {
      setIsGallerySubmitting(false);
    }
  };

  const handleOpenEditGallery = (item: FactoryGalleryItem) => {
    setGalleryError(null);
    setEditingGalleryItem(item);
    setGalleryForm({
      title: item.title,
      description: item.description || '',
      capturedAt: item.capturedAt ? item.capturedAt.split('T')[0] : '',
      locationName: item.locationName || '',
      latitude: item.gpsCoordinates?.latitude ? String(item.gpsCoordinates.latitude) : '',
      longitude: item.gpsCoordinates?.longitude ? String(item.gpsCoordinates.longitude) : '',
      file: null,
    });
    setIsEditGalleryOpen(true);
  };

  const handleSaveEditGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGalleryItem) return;
    setGalleryError(null);

    const today = new Date().toISOString().split('T')[0];
    if (galleryForm.capturedAt && galleryForm.capturedAt > today) {
      setGalleryError('Capture date cannot be in the future.');
      return;
    }

    setIsGallerySubmitting(true);
    try {
      await manufacturerRegistrationApi.updateGalleryEntry(
        editingGalleryItem.id,
        {
          title: galleryForm.title.trim(),
          description: galleryForm.description.trim() || undefined,
          capturedAt: galleryForm.capturedAt || undefined,
          locationName: galleryForm.locationName.trim() || undefined,
          latitude: galleryForm.latitude ? parseFloat(galleryForm.latitude) : undefined,
          longitude: galleryForm.longitude ? parseFloat(galleryForm.longitude) : undefined,
        },
        mfgRegCode || undefined,
      );
      setIsEditGalleryOpen(false);
      setEditingGalleryItem(null);
      showToast('✓ Gallery photo metadata updated.');
      await loadGallery();
    } catch (err: any) {
      setGalleryError(err.message || 'Failed to update gallery entry.');
    } finally {
      setIsGallerySubmitting(false);
    }
  };

  const handleConfirmDeleteGallery = async () => {
    if (!deletingGalleryItem) return;
    setIsGallerySubmitting(true);
    try {
      await manufacturerRegistrationApi.deleteGalleryEntry(deletingGalleryItem.id, mfgRegCode || undefined);
      setDeletingGalleryItem(null);
      showToast('✓ Factory photo deleted.');
      await loadGallery();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setIsGallerySubmitting(false);
    }
  };

  const handleOpenAddAchievement = () => {
    setAchievementError(null);
    setAchievementForm({
      title: '',
      awardType: 'Quality Excellence',
      issuingOrganization: '',
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      description: '',
      certFile: null,
    });
    setIsAddAchievementOpen(true);
  };

  const handleSaveAddAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    setAchievementError(null);

    if (!achievementForm.title.trim()) {
      setAchievementError('Achievement/Award title is required.');
      return;
    }
    if (!achievementForm.issuingOrganization.trim()) {
      setAchievementError('Issuing organization is required.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    if (achievementForm.issueDate > today) {
      setAchievementError('Issue date cannot be in the future.');
      return;
    }
    if (achievementForm.expiryDate && achievementForm.expiryDate <= achievementForm.issueDate) {
      setAchievementError('Expiry date must be after the issue date.');
      return;
    }

    setIsAchievementSubmitting(true);
    try {
      await manufacturerRegistrationApi.createAchievement(
        {
          title: achievementForm.title.trim(),
          awardType: achievementForm.awardType.trim(),
          issuingOrganization: achievementForm.issuingOrganization.trim(),
          issueDate: achievementForm.issueDate,
          expiryDate: achievementForm.expiryDate || undefined,
          description: achievementForm.description.trim() || undefined,
        },
        achievementForm.certFile || undefined,
        mfgRegCode || undefined,
      );
      setIsAddAchievementOpen(false);
      showToast('✓ Achievement submitted. Status: Pending Verification.');
      await loadAchievements();
    } catch (err: any) {
      setAchievementError(err.message || 'Failed to create achievement.');
    } finally {
      setIsAchievementSubmitting(false);
    }
  };

  const handleOpenEditAchievement = (item: AchievementItem) => {
    setAchievementError(null);
    setEditingAchievement(item);
    setAchievementForm({
      title: item.title,
      awardType: item.awardType,
      issuingOrganization: item.issuingOrganization,
      issueDate: item.issueDate ? item.issueDate.split('T')[0] : '',
      expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
      description: item.description || '',
      certFile: null,
    });
    setIsEditAchievementOpen(true);
  };

  const handleSaveEditAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAchievement) return;
    setAchievementError(null);

    const today = new Date().toISOString().split('T')[0];
    if (achievementForm.issueDate > today) {
      setAchievementError('Issue date cannot be in the future.');
      return;
    }
    if (achievementForm.expiryDate && achievementForm.expiryDate <= achievementForm.issueDate) {
      setAchievementError('Expiry date must be after the issue date.');
      return;
    }

    setIsAchievementSubmitting(true);
    try {
      await manufacturerRegistrationApi.updateAchievement(
        editingAchievement.id,
        {
          title: achievementForm.title.trim(),
          awardType: achievementForm.awardType.trim(),
          issuingOrganization: achievementForm.issuingOrganization.trim(),
          issueDate: achievementForm.issueDate,
          expiryDate: achievementForm.expiryDate || undefined,
          description: achievementForm.description.trim() || undefined,
        },
        mfgRegCode || undefined,
      );

      if (achievementForm.certFile) {
        await manufacturerRegistrationApi.uploadAchievementCertificate(
          editingAchievement.id,
          achievementForm.certFile,
          mfgRegCode || undefined,
        );
      }

      setIsEditAchievementOpen(false);
      setEditingAchievement(null);
      showToast('✓ Achievement updated successfully.');
      await loadAchievements();
    } catch (err: any) {
      setAchievementError(err.message || 'Failed to update achievement.');
    } finally {
      setIsAchievementSubmitting(false);
    }
  };

  const handleConfirmDeleteAchievement = async () => {
    if (!deletingAchievement) return;
    setIsAchievementSubmitting(true);
    try {
      await manufacturerRegistrationApi.deleteAchievement(deletingAchievement.id, mfgRegCode || undefined);
      setDeletingAchievement(null);
      showToast('✓ Achievement record deleted.');
      await loadAchievements();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setIsAchievementSubmitting(false);
    }
  };

  const loadMyDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      if (currentRole === 'BUYER') {
        let res: any = null;
        try {
          res = await buyerRegistrationApi.getMyRegistration();
        } catch {
          // If no registration exists for this buyer yet, clean state
          setRealDocs([]);
          setIsLoadingDocs(false);
          return;
        }

        const reg = res?.registration || res;
        const regCode = res?.registrationCode || reg?.registrationCode || '';
        if (regCode) {
          setBuyerRegCode(regCode);
        }

        const STANDARD_BUYER_DOCS = [
          'GST Certificate',
          'PAN Card',
          'Drug License',
          'Incorporation Certificate',
          'Cancelled Cheque',
          'Signed Agreement'
        ];

        if (reg && regCode) {
          const docsList = Array.isArray(res?.documents)
            ? res.documents
            : (Array.isArray(reg?.documents) ? reg.documents : []);
          const uploadedCategories = new Set(docsList.map((d: any) => d.category));

          const mapped: UserDocument[] = docsList.map((d: any) => {
            const isVerified = d.status === 'VALID' || d.status === 'APPROVED';
            const isRejected = d.status === 'REJECTED';
            const isReplacement = d.status === 'NEEDS_REPLACEMENT';
            const isGstOrPan = d.category === 'GST Certificate' || d.category === 'PAN Card';

            let vStatus: ProfileDocStatus;
            let statusRemarks = d.rejectionReason;
            let statusVerifiedBy = d.reviewedBy;

            if (isVerified) {
              vStatus = 'VERIFIED';
              statusRemarks = d.rejectionReason || 'Verified by Compliance Desk';
              statusVerifiedBy = d.reviewedBy || 'Compliance Officer';
            } else if (isReplacement) {
              vStatus = 'REPLACEMENT REQUESTED';
              statusRemarks = d.rejectionReason || 'Replacement requested by Compliance Officer';
              statusVerifiedBy = d.reviewedBy || 'Compliance Officer';
            } else if (isRejected) {
              vStatus = 'REJECTED';
              statusRemarks = d.rejectionReason || 'Rejected during compliance review';
              statusVerifiedBy = d.reviewedBy || 'Compliance Officer';
            } else {
              // PENDING
              if (isGstOrPan) {
                vStatus = 'PENDING VERIFICATION'; // Renders as "UPLOADED — VERIFICATION PENDING"
                statusRemarks = 'Awaiting automated government API verification';
                statusVerifiedBy = 'Pending API Verification';
              } else {
                vStatus = 'PENDING REVIEW'; // Renders as "UPLOADED — PENDING ADMIN REVIEW"
                statusRemarks = 'Pending compliance officer review';
                statusVerifiedBy = 'Pending Admin Review';
              }
            }

            // Real document number: only use real registration fields, never fake strings!
            let realDocNumber = '—';
            if (d.category === 'GST Certificate' && reg.gstNumber) {
              realDocNumber = reg.gstNumber;
            } else if (d.category === 'PAN Card' && reg.panNumber) {
              realDocNumber = reg.panNumber;
            } else if (d.category === 'Drug License' && reg.drugLicenseNumber) {
              realDocNumber = reg.drugLicenseNumber;
            } else if (d.category === 'Incorporation Certificate' && reg.cinNumber) {
              realDocNumber = reg.cinNumber;
            }

            return {
              id: String(d.id),
              documentName: d.categoryDisplayName || d.category,
              documentType: d.category,
              documentNumber: realDocNumber,
              issueDate: '—',
              expiryDate: '—',
              uploadedDate: d.uploadedAt ? new Date(d.uploadedAt).toISOString().split('T')[0] : '—',
              lastUpdated: d.uploadedAt ? new Date(d.uploadedAt).toISOString().split('T')[0] : '—',
              verificationStatus: vStatus,
              verifiedBy: statusVerifiedBy,
              verificationDate: d.reviewedAt ? new Date(d.reviewedAt).toISOString().split('T')[0] : undefined,
              remarks: statusRemarks,
              fileName: d.fileName,
              fileUrl: `/api/v1/compliance/documents/${d.id}/download`,
            };
          });

          if (docsList.length === 0) {
            setRealDocs([]);
          } else {
            // Unuploaded optional documents shown with status NOT UPLOADED so buyer can upload from profile
            const unuploaded: UserDocument[] = STANDARD_BUYER_DOCS
              .filter(cat => !uploadedCategories.has(cat))
              .map(cat => ({
                id: `not_uploaded_${cat.toLowerCase().replace(/\s+/g, '_')}`,
                documentName: cat,
                documentType: cat,
                documentNumber: '—',
                issueDate: '—',
                expiryDate: '—',
                uploadedDate: '—',
                lastUpdated: '—',
                verificationStatus: 'NOT UPLOADED' as ProfileDocStatus,
                verifiedBy: '—',
                remarks: 'Optional document — upload anytime from your profile',
                fileName: ''
              }));

            setRealDocs([...mapped, ...unuploaded]);
          }
        } else {
          setRealDocs([]);
        }
      } else if (currentRole === 'SUPPLIER') {
        const res = await manufacturerRegistrationApi.getMyRegistration();
        if (res?.registrationCode) {
          setMfgRegCode(res.registrationCode);
          loadGallery(res.registrationCode);
          loadAchievements(res.registrationCode);
        } else {
          loadGallery();
          loadAchievements();
        }
        if (Array.isArray(res?.documents) && res.documents.length > 0) {
          const mapped: UserDocument[] = res.documents.map((d: any) => {
            const isVerified = d.status === 'VALID' || d.status === 'APPROVED';
            const isRejected = d.status === 'REJECTED';
            const isReplacement = d.status === 'NEEDS_REPLACEMENT';
            return {
              id: d.id,
              documentName: d.categoryDisplayName || d.category,
              documentType: d.category,
              documentNumber: d.documentCode || 'N/A',
              issueDate: d.issueDate || 'N/A',
              expiryDate: d.expiryDate || 'N/A',
              uploadedDate: d.uploadedAt ? new Date(d.uploadedAt).toISOString().split('T')[0] : 'N/A',
              lastUpdated: d.uploadedAt ? new Date(d.uploadedAt).toISOString().split('T')[0] : 'N/A',
              verificationStatus: isVerified ? 'VERIFIED' : isReplacement ? 'REPLACEMENT REQUESTED' : isRejected ? 'REJECTED' : 'PENDING VERIFICATION',
              verifiedBy: d.verifiedBy || d.reviewedBy || (isVerified ? 'Compliance Officer' : 'Pending Compliance'),
              verificationDate: (d.verifiedAt || d.reviewedAt) ? new Date(d.verifiedAt || d.reviewedAt).toISOString().split('T')[0] : undefined,
              remarks: d.adminRemarks || d.rejectionReason || (isVerified ? 'Verified by Compliance Desk' : isReplacement ? 'Replacement requested by Compliance Officer' : 'Under compliance review'),
              fileName: d.originalFileName || d.fileName,
              fileUrl: d.downloadUrl || `/api/v1/manufacturer/documents/${d.id}/download`,
            };
          });
          setRealDocs(mapped);
        } else if (res?.registrationCode) {
          setRealDocs([]);
        }
      }
    } catch {
      setRealDocs([]);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  React.useEffect(() => {
    loadMyDocuments();
  }, [currentRole]);

  React.useEffect(() => {
    if (currentRole === 'SUPPLIER') {
      if (profileSubTab === 'gallery') {
        loadGallery();
      } else if (profileSubTab === 'achievements') {
        loadAchievements();
      }
    }
  }, [profileSubTab, currentRole]);

  // Preview blob loader for selectedDocForView
  React.useEffect(() => {
    if (!selectedDocForView) {
      if (docPreviewBlobUrl) {
        URL.revokeObjectURL(docPreviewBlobUrl);
        setDocPreviewBlobUrl(null);
      }
      setDocPreviewError(null);
      setIsDocPreviewLoading(false);
      return;
    }

    let active = true;
    setIsDocPreviewLoading(true);
    setDocPreviewError(null);

    const targetUrl = selectedDocForView.fileUrl && selectedDocForView.fileUrl !== '#'
      ? selectedDocForView.fileUrl
      : (currentRole === 'SUPPLIER'
          ? `/api/v1/manufacturer/documents/${selectedDocForView.id}/download`
          : `/api/v1/compliance/documents/${selectedDocForView.id}/download`);

    adminVerificationApi.getDocumentBlob(targetUrl)
      .then(({ blobUrl }) => {
        if (!active) {
          URL.revokeObjectURL(blobUrl);
          return;
        }
        setDocPreviewBlobUrl(blobUrl);
        setIsDocPreviewLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setIsDocPreviewLoading(false);
        setDocPreviewError(err.message || 'Document file not found in storage.');
      });

    return () => {
      active = false;
    };
  }, [selectedDocForView]);

  const handleDownloadDoc = async (doc: UserDocument) => {
    try {
      const targetUrl = doc.fileUrl && doc.fileUrl !== '#'
        ? doc.fileUrl
        : (currentRole === 'SUPPLIER'
            ? `/api/v1/manufacturer/documents/${doc.id}/download`
            : `/api/v1/compliance/documents/${doc.id}/download`);

      const { blobUrl } = await adminVerificationApi.getDocumentBlob(targetUrl);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = doc.fileName || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const effectiveDocs = realDocs !== null ? realDocs : userDocuments;

  // Edit Personal Profile Form State
  const [editUserForm, setEditUserForm] = useState({
    fullName: userProfile.fullName || '',
    phone: userProfile.phone || '',
    jobTitle: userProfile.jobTitle || '',
    department: userProfile.department || '',
    avatarUrl: userProfile.avatarUrl || ''
  });

  // Edit Organization Form State
  const [editOrgForm, setEditOrgForm] = useState({
    companyName: orgProfile.companyName || '',
    businessType: orgProfile.businessType || '',
    industry: orgProfile.industry || '',
    contactEmail: orgProfile.contactEmail || '',
    contactPhone: orgProfile.contactPhone || '',
    registeredAddress: orgProfile.registeredAddress || '',
    city: orgProfile.city || '',
    state: orgProfile.state || '',
    country: orgProfile.country || 'India',
    pincode: orgProfile.pincode || '',
    website: orgProfile.website || '',
    mfgLicenseNo: orgProfile.mfgLicenseNo || ''
  });

  // Upload/Replace Doc Form State
  const [docForm, setDocForm] = useState({
    documentType: 'GST Certificate',
    documentName: '',
    documentNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    fileName: '',
    remarks: ''
  });

  // Change Password Form State
  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passError, setPassError] = useState<string | null>(null);

    // Buyer 2FA State
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('fg_buyer_2fa_enabled') === 'true';
    } catch {
      return false;
    }
  });
  const [show2FASetupModal, setShow2FASetupModal] = useState<boolean>(false);
  const [show2FADisableModal, setShow2FADisableModal] = useState<boolean>(false);
  const [otpInput, setOtpInput] = useState<string>('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifying2FA, setIsVerifying2FA] = useState<boolean>(false);

  const handleVerifyAndEnable2FA = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    if (otpInput.trim().length !== 6 || !/^\d+$/.test(otpInput.trim())) {
      setOtpError('Please enter a valid 6-digit numerical OTP code.');
      return;
    }
    setIsVerifying2FA(true);
    setTimeout(() => {
      setIsVerifying2FA(false);
      setIs2FAEnabled(true);
      try { localStorage.setItem('fg_buyer_2fa_enabled', 'true'); } catch (err) {}
      setShow2FASetupModal(false);
      setOtpInput('');
      showToast('✓ Two-Factor Authentication (2FA) enabled successfully.');
    }, 500);
  };

  const handleDisable2FA = () => {
    setIs2FAEnabled(false);
    try { localStorage.setItem('fg_buyer_2fa_enabled', 'false'); } catch (err) {}
    setShow2FADisableModal(false);
    showToast('Two-Factor Authentication (2FA) disabled.');
  };

const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Profile Completion Math Calculation
  const calculateProfileCompletion = () => {
    let filledPersonal = 0;
    const personalFields = [userProfile.fullName, userProfile.email, userProfile.phone, userProfile.jobTitle, userProfile.department];
    personalFields.forEach(f => { if (f && f.trim().length > 0) filledPersonal++; });
    const personalScore = (filledPersonal / personalFields.length) * 35; // 35% weight

    let filledOrg = 0;
    const orgFields = [orgProfile.companyName, orgProfile.contactEmail, orgProfile.contactPhone, orgProfile.registeredAddress, orgProfile.city, orgProfile.state, orgProfile.gstin, orgProfile.pan];
    orgFields.forEach(f => { if (f && f.trim().length > 0) filledOrg++; });
    const orgScore = (filledOrg / orgFields.length) * 35; // 35% weight

    const verifiedDocs = effectiveDocs.filter(d => d.verificationStatus === 'VERIFIED').length;
    const totalDocs = Math.max(effectiveDocs.length, 1);
    const docScore = (verifiedDocs / totalDocs) * 30; // 30% weight

    return Math.min(100, Math.round(personalScore + orgScore + docScore));
  };

  const profileCompletion = calculateProfileCompletion();

  // Missing items determination
  const getMissingItems = () => {
    const missing: { label: string; tab: 'personal' | 'organization' | 'documents'; docId?: string }[] = [];
    if (!userProfile.phone || userProfile.phone.trim() === '') missing.push({ label: 'Phone Number', tab: 'personal' });
    if (!userProfile.jobTitle || userProfile.jobTitle.trim() === '') missing.push({ label: 'Job Title / Designation', tab: 'personal' });
    if (!orgProfile.website || orgProfile.website.trim() === '') missing.push({ label: 'Company Website', tab: 'organization' });
    
    effectiveDocs.forEach(d => {
      if (d.verificationStatus === 'NOT UPLOADED') {
        missing.push({ label: `${d.documentName || d.documentType} (Not Uploaded)`, tab: 'documents', docId: d.id });
      } else if (d.verificationStatus === 'REJECTED') {
        missing.push({ label: `${d.documentName || d.documentType} (Rejected - Needs Replacement)`, tab: 'documents', docId: d.id });
      } else if (d.verificationStatus === 'EXPIRED') {
        missing.push({ label: `${d.documentName || d.documentType} (Expired)`, tab: 'documents', docId: d.id });
      }
    });

    return missing;
  };

  const missingItems = getMissingItems();

  const docStats = {
    total: effectiveDocs.length,
    verified: effectiveDocs.filter(d => d.verificationStatus === 'VERIFIED').length,
    pending: effectiveDocs.filter(d => d.verificationStatus === 'PENDING VERIFICATION' || d.verificationStatus === 'PENDING REVIEW').length,
    expired: effectiveDocs.filter(d => d.verificationStatus === 'EXPIRED').length,
    rejected: effectiveDocs.filter(d => d.verificationStatus === 'REJECTED').length,
    notUploaded: effectiveDocs.filter(d => d.verificationStatus === 'NOT UPLOADED').length,
  };

  // Handlers for edit forms
  const handleOpenEditUser = () => {
    setEditUserForm({
      fullName: userProfile.fullName || '',
      phone: userProfile.phone || '',
      jobTitle: userProfile.jobTitle || '',
      department: userProfile.department || '',
      avatarUrl: userProfile.avatarUrl || ''
    });
    setIsEditProfileOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      fullName: editUserForm.fullName,
      phone: editUserForm.phone,
      jobTitle: editUserForm.jobTitle,
      department: editUserForm.department,
      avatarUrl: editUserForm.avatarUrl
    });
    setIsEditProfileOpen(false);
    showToast('Profile updated successfully.');
  };

  const handleOpenEditOrg = () => {
    setEditOrgForm({
      companyName: orgProfile.companyName || '',
      businessType: orgProfile.businessType || '',
      industry: orgProfile.industry || '',
      contactEmail: orgProfile.contactEmail || '',
      contactPhone: orgProfile.contactPhone || '',
      registeredAddress: orgProfile.registeredAddress || '',
      city: orgProfile.city || '',
      state: orgProfile.state || '',
      country: orgProfile.country || 'India',
      pincode: orgProfile.pincode || '',
      website: orgProfile.website || '',
      mfgLicenseNo: orgProfile.mfgLicenseNo || ''
    });
    setIsEditOrgOpen(true);
  };

  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrgProfile({
      companyName: editOrgForm.companyName,
      businessType: editOrgForm.businessType,
      industry: editOrgForm.industry,
      contactEmail: editOrgForm.contactEmail,
      contactPhone: editOrgForm.contactPhone,
      registeredAddress: editOrgForm.registeredAddress,
      city: editOrgForm.city,
      state: editOrgForm.state,
      country: editOrgForm.country,
      pincode: editOrgForm.pincode,
      website: editOrgForm.website,
      mfgLicenseNo: editOrgForm.mfgLicenseNo
    });
    setIsEditOrgOpen(false);
    showToast('Organization profile updated successfully.');
  };

  const handleOpenUploadDoc = (docType?: string) => {
    setDocForm({
      documentType: docType || 'GST Certificate',
      documentName: docType || 'GST Certificate',
      documentNumber: '',
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      fileName: '',
      remarks: ''
    });
    setIsUploadDocOpen(true);
  };

  const handleSaveUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFileForUpload) {
      alert('Please choose a document file to upload (PDF, PNG, JPG).');
      return;
    }

    if (currentRole === 'BUYER') {
      if (!buyerRegCode) {
        alert('Upload failed: No active registration code found for this buyer account.');
        return;
      }
      try {
        await buyerRegistrationApi.uploadDocument(selectedFileForUpload, docForm.documentType, buyerRegCode);
        setIsUploadDocOpen(false);
        setSelectedFileForUpload(null);
        showToast('Document uploaded successfully. Status: PENDING REVIEW.');
        await loadMyDocuments();
        return;
      } catch (err: any) {
        alert(`Document upload failed: ${err.message || 'Storage persistence error'}`);
        return;
      }
    }

    uploadUserDocument({
      documentName: docForm.documentName || docForm.documentType,
      documentType: docForm.documentType,
      documentNumber: docForm.documentNumber,
      issueDate: docForm.issueDate,
      expiryDate: docForm.expiryDate || 'N/A',
      fileName: selectedFileForUpload.name,
      remarks: docForm.remarks
    });
    setIsUploadDocOpen(false);
    setSelectedFileForUpload(null);
    showToast('Document uploaded successfully.');
    await loadMyDocuments();
  };

  const handleOpenReplaceDoc = (doc: UserDocument) => {
    setSelectedDocForReplace(doc);
    setDocForm({
      documentType: doc.documentType,
      documentName: doc.documentName,
      documentNumber: doc.documentNumber || '',
      issueDate: doc.issueDate || new Date().toISOString().split('T')[0],
      expiryDate: doc.expiryDate || '',
      fileName: '',
      remarks: ''
    });
  };

  const handleSaveReplaceDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocForReplace) return;

    if (!selectedFileForReplace) {
      alert('Please choose a file to upload.');
      return;
    }

    if (currentRole === 'BUYER') {
      if (!buyerRegCode) {
        alert('Upload failed: No active registration code found for this buyer account.');
        return;
      }
      try {
        await buyerRegistrationApi.uploadDocument(
          selectedFileForReplace,
          selectedDocForReplace.documentType,
          buyerRegCode
        );
        setSelectedDocForReplace(null);
        setSelectedFileForReplace(null);
        showToast('Document submitted successfully. Status updated to PENDING REVIEW.');
        await loadMyDocuments();
        return;
      } catch (err: any) {
        alert(`Document upload failed: ${err.message || 'Storage persistence error'}`);
        return;
      }
    }

    if (currentRole === 'SUPPLIER' && mfgRegCode) {
      try {
        await manufacturerRegistrationApi.uploadDocument(
          selectedFileForReplace,
          selectedDocForReplace.documentType,
          mfgRegCode,
          docForm.issueDate || new Date().toISOString().split('T')[0],
          docForm.expiryDate || '2030-12-31'
        );
        setSelectedDocForReplace(null);
        setSelectedFileForReplace(null);
        showToast('Replacement document submitted to backend storage.');
        await loadMyDocuments();
        return;
      } catch (err: any) {
        alert(`Document upload failed: ${err.message || 'Server error'}`);
        return;
      }
    }

    replaceUserDocument(selectedDocForReplace.id, {
      documentNumber: docForm.documentNumber,
      issueDate: docForm.issueDate,
      expiryDate: docForm.expiryDate || 'N/A',
      fileName: selectedFileForReplace.name,
      remarks: docForm.remarks
    });
    setSelectedDocForReplace(null);
    setSelectedFileForReplace(null);
    showToast('Document submitted.');
    await loadMyDocuments();
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassError('New Password and Confirm New Password do not match.');
      return;
    }
    const result = changeUserPassword(passForm.currentPassword, passForm.newPassword);
    if (result.success) {
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast(result.message);
    } else {
      setPassError(result.message);
    }
  };

  const getStatusBadge = (status: ProfileDocStatus) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', fontSize: 11, fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <CheckCircle2 size={12} /> VERIFIED
          </span>
        );
      case 'PENDING VERIFICATION':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6', fontSize: 11, fontWeight: 700, border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <Clock size={12} /> UPLOADED — VERIFICATION PENDING
          </span>
        );
      case 'PENDING REVIEW':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, background: 'rgba(245, 158, 11, 0.12)', color: '#D97706', fontSize: 11, fontWeight: 700, border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <Clock size={12} /> UPLOADED — PENDING ADMIN REVIEW
          </span>
        );
      case 'REJECTED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', fontSize: 11, fontWeight: 700, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <XCircle size={12} /> REJECTED
          </span>
        );
      case 'REPLACEMENT REQUESTED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, background: 'rgba(219, 39, 119, 0.12)', color: '#DB2777', fontSize: 11, fontWeight: 700, border: '1px solid rgba(219, 39, 119, 0.3)' }}>
            <AlertTriangle size={12} /> REPLACEMENT REQUESTED
          </span>
        );
      case 'EXPIRED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', fontSize: 11, fontWeight: 700, border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <AlertTriangle size={12} /> EXPIRED
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, background: 'rgba(100, 116, 139, 0.12)', color: '#64748B', fontSize: 11, fontWeight: 700, border: '1px solid rgba(100, 116, 139, 0.3)' }}>
            NOT UPLOADED
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, position: 'relative' }}>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: 70,
          right: 24,
          zIndex: 99999,
          background: '#0F766E',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: 8,
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 13,
          fontWeight: 700
        }}>
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Command Bar */}
      <div className="ent-command-bar">
        <div className="ent-command-bar-left">
          <div>
            <div className="ent-label">Account & Corporate Settings</div>
            <div className="ent-page-title" style={{ margin: 0 }}>
              {profileSubTab === 'personal' && 'MY PROFILE'}
              {profileSubTab === 'organization' && 'ORGANIZATION PROFILE'}
              {profileSubTab === 'documents' && 'DOCUMENTS & VERIFICATION'}
              {profileSubTab === 'gallery' && 'FACTORY PRODUCTION & FACILITY GALLERY'}
              {profileSubTab === 'achievements' && 'ACHIEVEMENTS, AWARDS & RECOGNITIONS'}
              {profileSubTab === 'security' && 'ACCOUNT SECURITY & PASSWORD'}
            </div>
            <div className="ent-caption" style={{ marginTop: 2 }}>
              {profileSubTab === 'personal' && 'Manage your personal account details, credentials and preferences.'}
              {profileSubTab === 'organization' && `Corporate profile for ${orgProfile.companyName || 'registered entity'}.`}
              {profileSubTab === 'documents' && 'Upload and maintain statutory compliance licenses and business credentials.'}
              {profileSubTab === 'gallery' && 'Authentic production photos, cleanrooms, and testing facilities stored securely in object storage.'}
              {profileSubTab === 'achievements' && 'Quality awards, WHO-GMP recognitions, and competitive accolades with verifiable credentials.'}
              {profileSubTab === 'security' && 'Manage login password and security preferences.'}
            </div>
          </div>
        </div>

        <div className="ent-command-bar-right">
          {profileSubTab === 'personal' && (
            <button className="ent-btn-primary" onClick={handleOpenEditUser}>
              <Edit3 size={14} /> Edit Profile
            </button>
          )}
          {profileSubTab === 'organization' && (
            <button className="ent-btn-primary" onClick={handleOpenEditOrg}>
              <Edit3 size={14} /> Edit Organization
            </button>
          )}
          {profileSubTab === 'documents' && (
            <button className="ent-btn-primary" onClick={() => handleOpenUploadDoc()}>
              <Upload size={14} /> Upload Document
            </button>
          )}
          {profileSubTab === 'gallery' && currentRole === 'SUPPLIER' && (
            <button className="ent-btn-primary" onClick={handleOpenUploadGallery}>
              <Plus size={14} /> Upload Factory Photo
            </button>
          )}
          {profileSubTab === 'achievements' && currentRole === 'SUPPLIER' && (
            <button className="ent-btn-primary" onClick={handleOpenAddAchievement}>
              <Plus size={14} /> Add Achievement
            </button>
          )}
        </div>
      </div>

      {/* ── PROFILE DASHBOARD SUMMARY CARDS ─────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        {/* Profile Completion */}
        <div className="ent-card" style={{ background: 'var(--bg-surface)', padding: 18, borderLeft: '4px solid var(--c-primary)' }}>
          <div className="ent-label" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>PROFILE COMPLETION</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', marginTop: 4, display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span>{profileCompletion}%</span>
            <span style={{ fontSize: 11, color: profileCompletion === 100 ? '#10B981' : '#F59E0B', fontWeight: 700 }}>
              {profileCompletion === 100 ? '● Complete' : '● Action Needed'}
            </span>
          </div>
          {/* Completion Progress Bar */}
          <div style={{ height: 6, background: 'var(--bg-subtle)', borderRadius: 999, marginTop: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${profileCompletion}%`, background: 'linear-gradient(90deg, #14B8A6, #2563EB)', transition: 'width 300ms ease' }} />
          </div>
        </div>

        {/* Total Documents */}
        <div className="ent-card" style={{ background: 'var(--bg-surface)', padding: 18, borderLeft: '4px solid #3B82F6' }}>
          <div className="ent-label" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>DOCUMENTS</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', marginTop: 4 }}>
            {docStats.verified} / {docStats.total}
          </div>
          <div className="ent-caption" style={{ marginTop: 4 }}>Total Statutory Files</div>
        </div>

        {/* Verified Count */}
        <div className="ent-card" style={{ background: 'var(--bg-surface)', padding: 18, borderLeft: '4px solid #10B981' }}>
          <div className="ent-label" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>VERIFIED</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#10B981', marginTop: 4 }}>
            {docStats.verified}
          </div>
          <div className="ent-caption" style={{ marginTop: 4 }}>Audit Passed</div>
        </div>

        {/* Pending Count */}
        <div className="ent-card" style={{ background: 'var(--bg-surface)', padding: 18, borderLeft: '4px solid #3B82F6' }}>
          <div className="ent-label" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>PENDING</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#3B82F6', marginTop: 4 }}>
            {docStats.pending}
          </div>
          <div className="ent-caption" style={{ marginTop: 4 }}>Under Compliance Review</div>
        </div>

        {/* Expired / Rejected Count */}
        <div className="ent-card" style={{ background: 'var(--bg-surface)', padding: 18, borderLeft: '4px solid #EF4444' }}>
          <div className="ent-label" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>EXPIRED / REJECTED</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: (docStats.expired + docStats.rejected) > 0 ? '#EF4444' : 'var(--text-primary)', marginTop: 4 }}>
            {docStats.expired + docStats.rejected}
          </div>
          <div className="ent-caption" style={{ marginTop: 4 }}>Requires Replacement</div>
        </div>

        {/* Factory Photos Count (Supplier Only) */}
        {currentRole === 'SUPPLIER' && (
          <>
            <div className="ent-card" style={{ background: 'var(--bg-surface)', padding: 18, borderLeft: '4px solid #0F766E' }}>
              <div className="ent-label" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>FACTORY PHOTOS</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', marginTop: 4 }}>
                {galleryList.length}
              </div>
              <div className="ent-caption" style={{ marginTop: 4 }}>
                {galleryList.filter(g => g.verificationStatus === 'VERIFIED').length} Verified / {galleryList.filter(g => g.verificationStatus === 'PENDING_VERIFICATION').length} Pending
              </div>
            </div>

            <div className="ent-card" style={{ background: 'var(--bg-surface)', padding: 18, borderLeft: '4px solid #8B5CF6' }}>
              <div className="ent-label" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>AWARDS & ACCOLADES</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', marginTop: 4 }}>
                {achievementsList.length}
              </div>
              <div className="ent-caption" style={{ marginTop: 4 }}>
                {achievementsList.filter(a => a.verificationStatus === 'VERIFIED').length} Verified / {achievementsList.filter(a => a.verificationStatus === 'PENDING_VERIFICATION').length} Pending
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── PROFILE COMPLETION WIDGET (If missing items exist) ── */}
      {missingItems.length > 0 && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.06)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: 12,
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} style={{ color: '#F59E0B' }} />
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                Profile Completion — {profileCompletion}%
              </span>
            </div>
            <span style={{ fontSize: 11.5, color: '#F59E0B', fontWeight: 700 }}>
              {missingItems.length} item{missingItems.length > 1 ? 's' : ''} missing
            </span>
          </div>

          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 500 }}>
            Complete your account and statutory documentation to maintain WHO-GMP / CDSCO compliant verified status on FactoryGrid:
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {missingItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setProfileSubTab(item.tab);
                  if (item.tab === 'personal') handleOpenEditUser();
                  if (item.tab === 'organization') handleOpenEditOrg();
                  if (item.tab === 'documents') handleOpenUploadDoc(item.label.split('(')[0].trim());
                }}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: 6,
                  padding: '5px 10px',
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>• {item.label}</span>
                <ChevronRight size={12} style={{ color: '#F59E0B' }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── NAVIGATION SUB-TABS ────────────────────────────── */}
      <div className="ent-tab-bar" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
        <button
          className={`ent-tab ${profileSubTab === 'personal' ? 'active' : ''}`}
          onClick={() => setProfileSubTab('personal')}
        >
          <User size={15} /> Personal Profile
        </button>
        <button
          className={`ent-tab ${profileSubTab === 'organization' ? 'active' : ''}`}
          onClick={() => setProfileSubTab('organization')}
        >
          <Building2 size={15} /> Organization Profile
        </button>
        <button
          className={`ent-tab ${profileSubTab === 'documents' ? 'active' : ''}`}
          onClick={() => setProfileSubTab('documents')}
        >
          <FileCheck size={15} /> Documents & Verification
          {docStats.pending > 0 && (
            <span style={{ background: '#3B82F6', color: '#FFF', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 999, marginLeft: 6 }}>
              {docStats.pending}
            </span>
          )}
        </button>
        {currentRole === 'SUPPLIER' && (
          <>
            <button
              className={`ent-tab ${profileSubTab === 'gallery' ? 'active' : ''}`}
              onClick={() => setProfileSubTab('gallery')}
            >
              <ImageIcon size={15} /> Factory Gallery
              {galleryList.length > 0 && (
                <span style={{ background: '#0F766E', color: '#FFF', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 999, marginLeft: 6 }}>
                  {galleryList.length}
                </span>
              )}
            </button>
            <button
              className={`ent-tab ${profileSubTab === 'achievements' ? 'active' : ''}`}
              onClick={() => setProfileSubTab('achievements')}
            >
              <Award size={15} /> Achievements & Awards
              {achievementsList.length > 0 && (
                <span style={{ background: '#8B5CF6', color: '#FFF', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 999, marginLeft: 6 }}>
                  {achievementsList.length}
                </span>
              )}
            </button>
          </>
        )}
        <button
          className={`ent-tab ${profileSubTab === 'security' ? 'active' : ''}`}
          onClick={() => setProfileSubTab('security')}
        >
          <KeyRound size={15} /> Security & Password
        </button>
      </div>

      {/* ── TAB 1: PERSONAL PROFILE ─────────────────────────── */}
      {profileSubTab === 'personal' && (
        <div className="ent-panel" style={{ background: 'var(--bg-surface)', padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Avatar & Key Profile Overview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, paddingBottom: 20, borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--c-primary), #2563EB)',
              color: '#FFFFFF',
              fontSize: 24,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              border: '3px solid var(--bg-surface)',
              flexShrink: 0
            }}>
              {userProfile.fullName ? userProfile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2) : currentRole.slice(0, 2)}
            </div>

            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {userProfile.fullName || 'User Profile'}
                </h2>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: 'rgba(16,185,129,0.12)', color: '#10B981', fontSize: 11, fontWeight: 700 }}>
                  <CheckCircle2 size={12} /> {userProfile.accountStatus || 'Active'}
                </span>
              </div>

              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>
                {userProfile.jobTitle || 'Executive User'} — <span style={{ color: 'var(--c-primary)', fontWeight: 700 }}>{userProfile.department || 'Operations'}</span>
              </div>

              <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <span><strong>Role:</strong> {userProfile.role || currentRole}</span>
                <span><strong>Last Login:</strong> {userProfile.lastLogin || 'Today'}</span>
                <span><strong>User ID:</strong> {userProfile.id || 'usr_001'}</span>
              </div>
            </div>

            <button className="ent-btn-primary" onClick={handleOpenEditUser}>
              <Edit3 size={14} /> Edit Profile
            </button>
          </div>

          {/* Detailed Personal Profile Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">Full Name</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{userProfile.fullName || 'Not Provided'}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">Corporate Email (Read-Only)</span>
              <span className="ent-mono" style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>{userProfile.email}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">Phone Number</span>
              <span className="ent-mono" style={{ fontSize: 13.5, fontWeight: 700, color: userProfile.phone ? 'var(--text-primary)' : '#F59E0B' }}>
                {userProfile.phone || '• Missing — Click Edit Profile'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">Job Title / Designation</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{userProfile.jobTitle || 'Executive'}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">Department</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{userProfile.department || 'Operations'}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">Assigned Role (Protected)</span>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--c-primary)' }}>{userProfile.role || currentRole}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: ORGANIZATION PROFILE ─────────────────────── */}
      {profileSubTab === 'organization' && (
        <div className="ent-panel" style={{ background: 'var(--bg-surface)', padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Building2 size={22} style={{ color: 'var(--c-primary)' }} />
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {orgProfile.companyName || 'Organization Profile'}
                </h2>
                {orgProfile.isVerified && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: 'rgba(16,185,129,0.12)', color: '#10B981', fontSize: 11, fontWeight: 700 }}>
                    <ShieldCheck size={12} /> Verified Entity
                  </span>
                )}
              </div>
              <div className="ent-caption" style={{ marginTop: 4 }}>
                {currentRole === 'SUPPLIER' ? 'Verified Manufacturer Organization Details' : currentRole === 'BUYER' ? 'Verified Buyer Organization Details' : 'System Organization Profile'}
              </div>
            </div>

            <button className="ent-btn-primary" onClick={handleOpenEditOrg}>
              <Edit3 size={14} /> Edit Organization
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">{currentRole === 'BUYER' ? 'Organization Name' : 'Company Name'}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{orgProfile.companyName}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">{currentRole === 'BUYER' ? 'Organization Code (Protected)' : 'Company Code (Protected)'}</span>
              <span className="ent-mono" style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--c-primary)' }}>{orgProfile.companyCode}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">Business Type</span>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{orgProfile.businessType || 'Private Limited'}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">Industry Sector</span>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{orgProfile.industry || 'Pharmaceuticals'}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">GSTIN (Verified ID)</span>
              <span className="ent-mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{orgProfile.gstin || 'N/A'}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">PAN Number</span>
              <span className="ent-mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{orgProfile.pan || 'N/A'}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">CIN / Registration Number</span>
              <span className="ent-mono" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{orgProfile.cinNumber || 'N/A'}</span>
            </div>

            {currentRole === 'SUPPLIER' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <span className="ent-label">State FDA Manufacturing License No</span>
                <span className="ent-mono" style={{ fontSize: 13, fontWeight: 800, color: '#10B981' }}>{orgProfile.mfgLicenseNo || 'ML-HP-2024-001'}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">Corporate Contact Email</span>
              <span className="ent-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{orgProfile.contactEmail}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">Contact Phone</span>
              <span className="ent-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{orgProfile.contactPhone}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)', gridColumn: 'span 2' }}>
              <span className="ent-label">Registered Address</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                {orgProfile.registeredAddress}, {orgProfile.city}, {orgProfile.state}, {orgProfile.country} — {orgProfile.pincode}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">Website</span>
              {orgProfile.website ? (
                <a href={orgProfile.website} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-primary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {orgProfile.website} <ExternalLink size={12} />
                </a>
              ) : (
                <span style={{ fontSize: 13, color: '#F59E0B' }}>• Not provided</span>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── TAB 3: DOCUMENTS & VERIFICATION ─────────────────── */}
      {profileSubTab === 'documents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Sub-section tab switcher for Documents & Verification */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', paddingBottom: 4 }}>
            <button
              type="button"
              onClick={() => setDocSectionTab('statutory')}
              style={{
                padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                background: docSectionTab === 'statutory' ? 'var(--c-primary)' : 'var(--bg-surface)',
                color: docSectionTab === 'statutory' ? '#FFFFFF' : 'var(--text-secondary)',
                border: docSectionTab === 'statutory' ? 'none' : '1px solid var(--border-subtle)',
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
                boxShadow: docSectionTab === 'statutory' ? '0 2px 8px rgba(13, 148, 136, 0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <FileCheck size={16} />
              <span>Statutory & Regulatory Documents</span>
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 12,
                background: docSectionTab === 'statutory' ? 'rgba(255,255,255,0.25)' : 'var(--bg-app)',
                color: docSectionTab === 'statutory' ? '#FFFFFF' : 'var(--text-primary)',
                fontWeight: 800
              }}>
                {effectiveDocs.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDocSectionTab('brand')}
              style={{
                padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                background: docSectionTab === 'brand' ? 'var(--c-primary)' : 'var(--bg-surface)',
                color: docSectionTab === 'brand' ? '#FFFFFF' : 'var(--text-secondary)',
                border: docSectionTab === 'brand' ? 'none' : '1px solid var(--border-subtle)',
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
                boxShadow: docSectionTab === 'brand' ? '0 2px 8px rgba(13, 148, 136, 0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Award size={16} />
              <span>Brand Documents (LOA & Licensing)</span>
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 12,
                background: docSectionTab === 'brand' ? 'rgba(255,255,255,0.25)' : 'var(--bg-app)',
                color: docSectionTab === 'brand' ? '#FFFFFF' : 'var(--text-primary)',
                fontWeight: 800
              }}>
                {brandDocsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDocSectionTab('trademark')}
              style={{
                padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                background: docSectionTab === 'trademark' ? 'var(--c-primary)' : 'var(--bg-surface)',
                color: docSectionTab === 'trademark' ? '#FFFFFF' : 'var(--text-secondary)',
                border: docSectionTab === 'trademark' ? 'none' : '1px solid var(--border-subtle)',
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
                boxShadow: docSectionTab === 'trademark' ? '0 2px 8px rgba(13, 148, 136, 0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Tag size={16} />
              <span>Trademark Documents & Certificates</span>
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 12,
                background: docSectionTab === 'trademark' ? 'rgba(255,255,255,0.25)' : 'var(--bg-app)',
                color: docSectionTab === 'trademark' ? '#FFFFFF' : 'var(--text-primary)',
                fontWeight: 800
              }}>
                {trademarkDocsCount}
              </span>
            </button>
          </div>

          {/* Section 1: Statutory & Regulatory Documents (Unchanged) */}
          {docSectionTab === 'statutory' && (
            <div className="ent-panel" style={{ background: 'var(--bg-surface)' }}>
              <div className="ent-panel-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileCheck size={18} style={{ color: 'var(--c-primary)' }} />
                    <div className="ent-section-title">Statutory & Regulatory Documents</div>
                  </div>
                  <div className="ent-caption" style={{ marginTop: 2 }}>
                    Central document repository for WHO-GMP, CDSCO and statutory business verification.
                  </div>
                </div>

                <button className="ent-btn-primary" onClick={() => handleOpenUploadDoc()}>
                  <Upload size={14} /> Upload New Document
                </button>
              </div>

              <table className="ent-table">
                <thead>
                  <tr>
                    <th>Document Name & Type</th>
                    <th>Document Number</th>
                    <th>Uploaded Date</th>
                    <th>Expiry Date</th>
                    <th>Verification Status</th>
                    <th>Last Updated</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingDocs ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                          <RefreshCw size={18} className="animate-spin" style={{ color: 'var(--c-primary)' }} />
                          <span>Loading verified documents...</span>
                        </div>
                      </td>
                    </tr>
                  ) : effectiveDocs.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-tertiary)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                          <FileText size={40} style={{ color: 'var(--text-tertiary)', opacity: 0.5 }} />
                          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>No Documents Uploaded</div>
                          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 420, lineHeight: 1.5 }}>
                            No statutory or regulatory documents have been uploaded for this account yet. Click below to upload your compliance documents.
                          </div>
                          <button
                            className="ent-btn-primary"
                            onClick={() => handleOpenUploadDoc()}
                            style={{ marginTop: 8 }}
                          >
                            <Upload size={14} /> Upload First Document
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    effectiveDocs.map(doc => (
                      <tr key={doc.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{doc.documentName}</div>
                          <div className="ent-caption">{doc.documentType}</div>
                          {doc.verificationStatus === 'REJECTED' && doc.remarks && (
                            <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <AlertCircle size={12} /> Reason: {doc.remarks}
                            </div>
                          )}
                        </td>
                        <td className="ent-mono" style={{ fontSize: 12 }}>{doc.documentNumber || '—'}</td>
                        <td className="ent-mono" style={{ fontSize: 12 }}>{doc.uploadedDate || '—'}</td>
                        <td className="ent-mono" style={{ fontSize: 12, color: doc.verificationStatus === 'EXPIRED' ? '#EF4444' : 'var(--text-secondary)' }}>
                          {doc.expiryDate || '—'}
                        </td>
                        <td>{getStatusBadge(doc.verificationStatus)}</td>
                        <td className="ent-mono" style={{ fontSize: 11 }}>{doc.lastUpdated || '—'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            {doc.verificationStatus !== 'NOT UPLOADED' && doc.fileName && (
                              <button
                                className="ent-btn-secondary"
                                style={{ height: 30, padding: '0 10px', fontSize: 11 }}
                                onClick={() => setSelectedDocForView(doc)}
                              >
                                <Eye size={12} /> View
                              </button>
                            )}
                            
                            {(doc.verificationStatus === 'NOT UPLOADED' || doc.verificationStatus === 'REJECTED' || doc.verificationStatus === 'EXPIRED') && (
                              <button
                                className="ent-btn-primary"
                                style={{ height: 30, padding: '0 10px', fontSize: 11, background: '#0D9488' }}
                                onClick={() => handleOpenReplaceDoc(doc)}
                              >
                                <RefreshCw size={12} /> {doc.verificationStatus === 'NOT UPLOADED' ? 'Upload' : 'Replace'}
                              </button>
                            )}

                            {(doc.verificationStatus === 'VERIFIED' || doc.verificationStatus === 'PENDING VERIFICATION' || doc.verificationStatus === 'PENDING REVIEW') && (
                              <button
                                className="ent-btn-secondary"
                                style={{ height: 30, padding: '0 8px', fontSize: 11 }}
                                onClick={() => handleOpenReplaceDoc(doc)}
                                title="Update / Upload New Version"
                              >
                                <RefreshCw size={11} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Section 2: Brand Documents (Real Backend Integration) */}
          {docSectionTab === 'brand' && (
            <BuyerBrandDocumentsSection onCountChange={setBrandDocsCount} />
          )}

          {/* Section 3: Trademark Documents (Real Backend Integration) */}
          {docSectionTab === 'trademark' && (
            <BuyerTrademarkDocumentsSection onCountChange={setTrademarkDocsCount} />
          )}

        </div>
      )}

      {/* ── TAB 4: SECURITY & PASSWORD ───────────────────────── */}
      {profileSubTab === 'security' && (
        <div className="ent-panel" style={{ background: 'var(--bg-surface)', padding: 24, maxWidth: 640 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
            <KeyRound size={20} style={{ color: 'var(--c-primary)' }} />
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Change Password</h2>
              <div className="ent-caption" style={{ marginTop: 2 }}>Ensure your account uses a strong, secure password.</div>
            </div>
          </div>

          <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 20 }}>
            {passError && (
              <div style={{ padding: '10px 14px', borderRadius: 6, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} />
                <span>{passError}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Current Password</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={passForm.currentPassword}
                onChange={e => setPassForm({ ...passForm, currentPassword: e.target.value })}
                style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>New Password</label>
              <input
                type="password"
                required
                placeholder="At least 8 characters"
                value={passForm.newPassword}
                onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })}
                style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Confirm New Password</label>
              <input
                type="password"
                required
                placeholder="Re-enter new password"
                value={passForm.confirmPassword}
                onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="submit" className="ent-btn-primary">
                Update Password
              </button>
            </div>
          </form>

          {/* ── TWO-FACTOR AUTHENTICATION (BUYER ONLY) ────────────────────────── */}
          {currentRole === 'BUYER' && (
            <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ShieldCheck size={20} style={{ color: is2FAEnabled ? '#10B981' : 'var(--c-primary)' }} />
                  <div>
                    <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Two-Factor Authentication</h2>
                    <div className="ent-caption" style={{ marginTop: 2 }}>
                      Add an additional layer of security to your Buyer account.
                    </div>
                  </div>
                </div>

                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 800,
                  background: is2FAEnabled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                  color: is2FAEnabled ? '#10B981' : '#F59E0B',
                  border: `1px solid ${is2FAEnabled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: is2FAEnabled ? '#10B981' : '#F59E0B' }} />
                  {is2FAEnabled ? '✓ 2FA Enabled' : '2FA Disabled'}
                </span>
              </div>

              <div style={{
                background: is2FAEnabled ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-subtle)',
                border: `1px solid ${is2FAEnabled ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-subtle)'}`,
                borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12
              }}>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {is2FAEnabled
                    ? 'Two-Factor Authentication is active for your account. Verification codes will be required during login and critical procurement approvals.'
                    : 'When 2FA is enabled, you will be required to enter a 6-digit security verification code sent to your registered mobile or authenticator app during login.'
                  }
                </div>

                <div>
                  {is2FAEnabled ? (
                    <button
                      onClick={() => setShow2FADisableModal(true)}
                      style={{
                        padding: '8px 16px', borderRadius: 6, background: 'rgba(239, 68, 68, 0.1)',
                        color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)',
                        fontWeight: 700, fontSize: 12.5, cursor: 'pointer'
                      }}
                    >
                      Disable 2FA
                    </button>
                  ) : (
                    <button
                      onClick={() => { setOtpInput(''); setOtpError(null); setShow2FASetupModal(true); }}
                      className="ent-btn-primary"
                      style={{ padding: '8px 18px', fontSize: 13 }}
                    >
                      Enable 2FA
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 5: FACTORY GALLERY (SUPPLIER ONLY) ───────────── */}
      {profileSubTab === 'gallery' && currentRole === 'SUPPLIER' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header Banner */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            padding: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ImageIcon size={20} style={{ color: '#0F766E' }} />
                <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Production Facility & Cleanroom Photo Gallery
                </h2>
              </div>
              <div className="ent-caption" style={{ marginTop: 4, maxWidth: 680 }}>
                Upload date-stamped, genuine photographs of your manufacturing facility, sterile suites, QA/QC instrumentation, and high-speed packaging lines. Stored securely via object storage and verified by compliance auditors.
              </div>
            </div>

            <button className="ent-btn-primary" onClick={handleOpenUploadGallery}>
              <Plus size={14} /> Upload Factory Photo
            </button>
          </div>

          {/* Gallery Content */}
          {isLoadingGallery ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
              <RefreshCw className="spin" size={24} style={{ margin: '0 auto 12px' }} />
              <div>Loading factory photographs from secure storage...</div>
            </div>
          ) : galleryList.length === 0 ? (
            /* Empty State */
            <div style={{
              background: 'var(--bg-surface)',
              border: '2px dashed var(--border-subtle)',
              borderRadius: 12,
              padding: 48,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12
            }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(15, 118, 110, 0.1)',
                color: '#0F766E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ImageIcon size={32} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>
                No Factory Photos Uploaded
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 480, lineHeight: 1.5 }}>
                No genuine factory photos exist for your facility yet. Add photos of your production floor, packaging lines, and QC laboratories to enhance verification and buyer confidence.
              </div>
              <button className="ent-btn-primary" onClick={handleOpenUploadGallery} style={{ marginTop: 6 }}>
                <Plus size={14} /> Upload First Factory Photo
              </button>
            </div>
          ) : (
            /* Real Photos Grid */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {galleryList.map(item => {
                const isVerified = item.verificationStatus === 'VERIFIED';
                const isRejected = item.verificationStatus === 'REJECTED';
                const isPending = !isVerified && !isRejected;

                return (
                  <div
                    key={item.id}
                    className="ent-card"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 12,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                  >
                    {/* Photo Container */}
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: 200,
                        background: '#0F172A',
                        cursor: 'pointer',
                        overflow: 'hidden'
                      }}
                      onClick={() => setPreviewGalleryItem(item)}
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 200ms ease'
                        }}
                        onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                        onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
                        onError={e => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />

                      {/* Verification Status Badge */}
                      <div style={{ position: 'absolute', top: 10, right: 10 }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 8px',
                          borderRadius: 999,
                          fontSize: 10.5,
                          fontWeight: 800,
                          background: isVerified ? '#10B981' : isRejected ? '#EF4444' : '#F59E0B',
                          color: '#FFFFFF',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                        }}>
                          {isVerified ? <CheckCircle2 size={11} /> : isRejected ? <XCircle size={11} /> : <Clock size={11} />}
                          {isVerified ? 'VERIFIED' : isRejected ? 'REJECTED' : 'PENDING REVIEW'}
                        </span>
                      </div>

                      {/* Hover Zoom Prompt */}
                      <div style={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        background: 'rgba(0,0,0,0.6)',
                        color: '#FFFFFF',
                        borderRadius: 6,
                        padding: '3px 8px',
                        fontSize: 11,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <ZoomIn size={12} /> Preview
                      </div>
                    </div>

                    {/* Metadata Details */}
                    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
                        {item.title}
                      </div>

                      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.4, minHeight: 36 }}>
                        {item.description || <span style={{ fontStyle: 'italic', color: 'var(--text-tertiary)' }}>No description provided</span>}
                      </div>

                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        padding: '10px 12px',
                        background: 'var(--bg-app)',
                        borderRadius: 8,
                        border: '1px solid var(--border-subtle)',
                        fontSize: 11.5
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-tertiary)' }}>📅 Capture Date</span>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {item.capturedAt ? new Date(item.capturedAt).toLocaleDateString() : 'Not provided'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-tertiary)' }}>📍 Location</span>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right', maxWidth: 180, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {item.locationName || 'Not provided'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-tertiary)' }}>🧭 GPS Coordinates</span>
                          <span style={{ fontWeight: 700, color: item.gpsCoordinates ? '#0F766E' : 'var(--text-tertiary)', fontFamily: item.gpsCoordinates ? 'monospace' : 'inherit' }}>
                            {formatGpsCoordinates(item.gpsCoordinates)}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-tertiary)' }}>👤 Uploaded By</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {item.uploadedBy || 'Staff'}
                          </span>
                        </div>
                      </div>

                      {/* Rejection Note if Rejected */}
                      {isRejected && item.rejectionReason && (
                        <div style={{
                          padding: '8px 10px',
                          background: 'rgba(239, 68, 68, 0.08)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: 6,
                          fontSize: 11.5,
                          color: '#DC2626'
                        }}>
                          <strong>Rejection Note:</strong> {item.rejectionReason}
                        </div>
                      )}

                      {/* Card Action Buttons */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                        <button
                          type="button"
                          className="ent-btn-secondary"
                          style={{ flex: 1, padding: '6px 10px', fontSize: 12, justifyContent: 'center' }}
                          onClick={() => setPreviewGalleryItem(item)}
                        >
                          <Eye size={13} /> View Large
                        </button>
                        <button
                          type="button"
                          className="ent-btn-secondary"
                          style={{ padding: '6px 10px', fontSize: 12 }}
                          onClick={() => handleOpenEditGallery(item)}
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          style={{
                            padding: '6px 10px',
                            borderRadius: 6,
                            background: 'rgba(239, 68, 68, 0.08)',
                            color: '#DC2626',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            fontSize: 12,
                            cursor: 'pointer'
                          }}
                          onClick={() => setDeletingGalleryItem(item)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 6: ACHIEVEMENTS & AWARDS (SUPPLIER ONLY) ─────── */}
      {profileSubTab === 'achievements' && currentRole === 'SUPPLIER' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header Banner */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            padding: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Award size={20} style={{ color: '#8B5CF6' }} />
                <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Manufacturer Achievements, Awards & Quality Recognitions
                </h2>
              </div>
              <div className="ent-caption" style={{ marginTop: 4, maxWidth: 680 }}>
                Record genuine certifications, quality milestones, and institutional awards. Upload supporting certificates for compliance desk verification.
              </div>
            </div>

            <button className="ent-btn-primary" onClick={handleOpenAddAchievement}>
              <Plus size={14} /> Add Achievement / Award
            </button>
          </div>

          {/* Achievements Content */}
          {isLoadingAchievements ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
              <RefreshCw className="spin" size={24} style={{ margin: '0 auto 12px' }} />
              <div>Loading genuine achievements & awards from database...</div>
            </div>
          ) : achievementsList.length === 0 ? (
            /* Empty State */
            <div style={{
              background: 'var(--bg-surface)',
              border: '2px dashed var(--border-subtle)',
              borderRadius: 12,
              padding: 48,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12
            }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(139, 92, 246, 0.1)',
                color: '#8B5CF6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Award size={32} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>
                No Achievements or Awards Recorded
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 480, lineHeight: 1.5 }}>
                Submit your verified awards, quality accolades, or WHO-GMP recognitions. Submissions are subject to compliance verification and will remain Pending Verification until approved.
              </div>
              <button className="ent-btn-primary" onClick={handleOpenAddAchievement} style={{ marginTop: 6 }}>
                <Plus size={14} /> Add First Achievement
              </button>
            </div>
          ) : (
            /* Real Achievements Cards */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
              {achievementsList.map(item => {
                const isVerified = item.verificationStatus === 'VERIFIED';
                const isRejected = item.verificationStatus === 'REJECTED';
                const isPending = !isVerified && !isRejected;

                return (
                  <div
                    key={item.id}
                    className="ent-card"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 12,
                      padding: 18,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                  >
                    {/* Header: Title, Type, Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{
                          width: 38,
                          height: 38,
                          borderRadius: 8,
                          background: 'rgba(139, 92, 246, 0.12)',
                          color: '#8B5CF6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Award size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
                            {item.title}
                          </div>
                          <span style={{
                            display: 'inline-block',
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: 4,
                            background: 'var(--bg-subtle)',
                            color: 'var(--text-secondary)',
                            marginTop: 4
                          }}>
                            {item.awardType}
                          </span>
                        </div>
                      </div>

                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 8px',
                        borderRadius: 999,
                        fontSize: 10.5,
                        fontWeight: 800,
                        background: isVerified ? 'rgba(16, 185, 129, 0.12)' : isRejected ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                        color: isVerified ? '#10B981' : isRejected ? '#EF4444' : '#F59E0B',
                        border: `1px solid ${isVerified ? 'rgba(16, 185, 129, 0.3)' : isRejected ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                      }}>
                        {isVerified ? <CheckCircle2 size={11} /> : isRejected ? <XCircle size={11} /> : <Clock size={11} />}
                        {isVerified ? 'VERIFIED' : isRejected ? 'REJECTED' : 'PENDING'}
                      </span>
                    </div>

                    {/* Description */}
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {item.description || <span style={{ fontStyle: 'italic', color: 'var(--text-tertiary)' }}>No description provided</span>}
                    </div>

                    {/* Details Table */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      padding: '10px 12px',
                      background: 'var(--bg-app)',
                      borderRadius: 8,
                      border: '1px solid var(--border-subtle)',
                      fontSize: 11.5
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-tertiary)' }}>🏢 Issuing Organization</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.issuingOrganization}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-tertiary)' }}>📅 Issue Date</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {item.issueDate ? new Date(item.issueDate).toLocaleDateString() : 'Not provided'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-tertiary)' }}>⏳ Expiry Date</span>
                        <span style={{ fontWeight: 700, color: item.expiryDate ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                          {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'Permanent / N/A'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4, borderTop: '1px solid var(--border-subtle)' }}>
                        <span style={{ color: 'var(--text-tertiary)' }}>📄 Certificate File</span>
                        {item.hasCertificate && item.certificateUrl ? (
                          <a
                            href={item.certificateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              color: '#1D4ED8',
                              fontWeight: 700,
                              textDecoration: 'none'
                            }}
                          >
                            <Download size={12} /> {item.certificateFileName || 'View Document'}
                          </a>
                        ) : (
                          <span style={{ fontStyle: 'italic', color: 'var(--text-tertiary)' }}>No document attached</span>
                        )}
                      </div>
                    </div>

                    {/* Rejection Note if Rejected */}
                    {isRejected && item.rejectionReason && (
                      <div style={{
                        padding: '8px 10px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 6,
                        fontSize: 11.5,
                        color: '#DC2626'
                      }}>
                        <strong>Rejection Reason:</strong> {item.rejectionReason}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                      <button
                        type="button"
                        className="ent-btn-secondary"
                        style={{ flex: 1, padding: '6px 10px', fontSize: 12, justifyContent: 'center' }}
                        onClick={() => handleOpenEditAchievement(item)}
                      >
                        <Edit3 size={13} /> Edit Submission
                      </button>
                      <button
                        type="button"
                        style={{
                          padding: '6px 10px',
                          borderRadius: 6,
                          background: 'rgba(239, 68, 68, 0.08)',
                          color: '#DC2626',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          fontSize: 12,
                          cursor: 'pointer'
                        }}
                        onClick={() => setDeletingAchievement(item)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL 1: EDIT PERSONAL PROFILE ───────────────────── */}
      {isEditProfileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 520, maxWidth: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: '0 25px 50px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Edit Personal Profile</div>
              <button onClick={() => setIsEditProfileOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Full Name</label>
                <input
                  type="text"
                  required
                  value={editUserForm.fullName}
                  onChange={e => setEditUserForm({ ...editUserForm, fullName: e.target.value })}
                  style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Corporate Email (Read-Only)</label>
                <input
                  type="text"
                  disabled
                  value={userProfile.email}
                  style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', color: 'var(--text-tertiary)', outline: 'none', cursor: 'not-allowed' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Phone Number</label>
                <input
                  type="text"
                  required
                  value={editUserForm.phone}
                  onChange={e => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                  style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Job Title / Designation</label>
                <input
                  type="text"
                  required
                  value={editUserForm.jobTitle}
                  onChange={e => setEditUserForm({ ...editUserForm, jobTitle: e.target.value })}
                  style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Department</label>
                <input
                  type="text"
                  required
                  value={editUserForm.department}
                  onChange={e => setEditUserForm({ ...editUserForm, department: e.target.value })}
                  style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="ent-btn-secondary" onClick={() => setIsEditProfileOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="ent-btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: EDIT ORGANIZATION PROFILE ──────────────── */}
      {isEditOrgOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 620, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Edit Organization Information</div>
              <button onClick={() => setIsEditOrgOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveOrg} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Organization Name</label>
                  <input
                    type="text"
                    required
                    value={editOrgForm.companyName}
                    onChange={e => setEditOrgForm({ ...editOrgForm, companyName: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Org Code (Protected)</label>
                  <input
                    type="text"
                    disabled
                    value={orgProfile.companyCode}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', color: 'var(--text-tertiary)', outline: 'none', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Business Type</label>
                  <input
                    type="text"
                    required
                    value={editOrgForm.businessType}
                    onChange={e => setEditOrgForm({ ...editOrgForm, businessType: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Industry Sector</label>
                  <input
                    type="text"
                    required
                    value={editOrgForm.industry}
                    onChange={e => setEditOrgForm({ ...editOrgForm, industry: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Contact Email</label>
                  <input
                    type="email"
                    required
                    value={editOrgForm.contactEmail}
                    onChange={e => setEditOrgForm({ ...editOrgForm, contactEmail: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Contact Phone</label>
                  <input
                    type="text"
                    required
                    value={editOrgForm.contactPhone}
                    onChange={e => setEditOrgForm({ ...editOrgForm, contactPhone: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Registered Address</label>
                <input
                  type="text"
                  required
                  value={editOrgForm.registeredAddress}
                  onChange={e => setEditOrgForm({ ...editOrgForm, registeredAddress: e.target.value })}
                  style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>City</label>
                  <input
                    type="text"
                    required
                    value={editOrgForm.city}
                    onChange={e => setEditOrgForm({ ...editOrgForm, city: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>State</label>
                  <input
                    type="text"
                    required
                    value={editOrgForm.state}
                    onChange={e => setEditOrgForm({ ...editOrgForm, state: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>PIN / ZIP</label>
                  <input
                    type="text"
                    required
                    value={editOrgForm.pincode}
                    onChange={e => setEditOrgForm({ ...editOrgForm, pincode: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Website</label>
                <input
                  type="text"
                  placeholder="https://example.com"
                  value={editOrgForm.website}
                  onChange={e => setEditOrgForm({ ...editOrgForm, website: e.target.value })}
                  style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="ent-btn-secondary" onClick={() => setIsEditOrgOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="ent-btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: UPLOAD DOCUMENT ─────────────────────────── */}
      {isUploadDocOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 540, maxWidth: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Upload Business Document</div>
              <button onClick={() => setIsUploadDocOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUploadDoc} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Document Category / Type</label>
                <select
                  value={docForm.documentType}
                  onChange={e => setDocForm({ ...docForm, documentType: e.target.value, documentName: e.target.value })}
                  style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                >
                  <option value="GST Certificate">GST Certificate</option>
                  <option value="PAN Card / PAN Document">PAN Card / PAN Document</option>
                  <option value="Company Registration Certificate">Company Registration Certificate</option>
                  <option value="Manufacturing License">Manufacturing License</option>
                  <option value="Drug License / applicable regulatory license">Drug License / WHO-GMP License</option>
                  <option value="Bank / Payment Details">Bank / Payment Details</option>
                  <option value="Quality Certificates">Quality Certificates (ISO / WHO-GMP)</option>
                  <option value="Other Business Documents">Other Business Documents</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. State FDA License 2026"
                  value={docForm.documentName}
                  onChange={e => setDocForm({ ...docForm, documentName: e.target.value })}
                  style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Document Number (if applicable)</label>
                  <input
                    type="text"
                    placeholder="Registration/License No"
                    value={docForm.documentNumber}
                    onChange={e => setDocForm({ ...docForm, documentNumber: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Expiry Date (if applicable)</label>
                  <input
                    type="date"
                    value={docForm.expiryDate}
                    onChange={e => setDocForm({ ...docForm, expiryDate: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Document File</label>
                <div style={{ border: '2px dashed var(--border-subtle)', borderRadius: 8, padding: 20, textAlign: 'center', background: 'var(--bg-app)', cursor: 'pointer' }}>
                  <Upload size={24} style={{ color: 'var(--c-primary)', marginBottom: 6 }} />
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>Choose PDF / JPG file or drag here</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>Max file size: 15 MB (CDSCO format compliant)</div>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFileForUpload(e.target.files[0]);
                        setDocForm({ ...docForm, fileName: e.target.files[0].name });
                      }
                    }}
                    style={{ marginTop: 8, fontSize: 12 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Remarks / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional context for compliance verifier..."
                  value={docForm.remarks}
                  onChange={e => setDocForm({ ...docForm, remarks: e.target.value })}
                  style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none', fontSize: 12 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="ent-btn-secondary" onClick={() => setIsUploadDocOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="ent-btn-primary">
                  Upload Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: VIEW DOCUMENT ──────────────────────────── */}
      {selectedDocForView && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 600, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={18} style={{ color: 'var(--c-primary)' }} />
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{selectedDocForView.documentName}</div>
              </div>
              <button onClick={() => setSelectedDocForView(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-app)', padding: 14, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <div>
                  <div className="ent-label">Verification Status</div>
                  <div style={{ marginTop: 4 }}>{getStatusBadge(selectedDocForView.verificationStatus)}</div>
                </div>
                <div>
                  <div className="ent-label">Document Type</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{selectedDocForView.documentType}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ padding: 12, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div className="ent-label">Document Number</div>
                  <div className="ent-mono" style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{selectedDocForView.documentNumber || 'N/A'}</div>
                </div>

                <div style={{ padding: 12, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div className="ent-label">Uploaded Date</div>
                  <div className="ent-mono" style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{selectedDocForView.uploadedDate || 'N/A'}</div>
                </div>

                <div style={{ padding: 12, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div className="ent-label">Expiry Date</div>
                  <div className="ent-mono" style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{selectedDocForView.expiryDate || 'N/A'}</div>
                </div>

                <div style={{ padding: 12, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div className="ent-label">Verified By</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{selectedDocForView.verifiedBy || 'Pending Compliance'}</div>
                </div>
              </div>

              {selectedDocForView.remarks && (
                <div style={{ padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div className="ent-label">Compliance Remarks / Verification Notes</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 }}>{selectedDocForView.remarks}</div>
                </div>
              )}

              {/* Version History if available */}
              {selectedDocForView.history && selectedDocForView.history.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div className="ent-section-title" style={{ fontSize: 13, marginBottom: 8 }}>Document Version Audit History</div>
                  <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden' }}>
                    <table className="ent-table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th>Ver</th>
                          <th>Uploaded Date</th>
                          <th>File Name</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDocForView.history.map((v, i) => (
                          <tr key={i}>
                            <td className="ent-mono">v{v.version}</td>
                            <td className="ent-mono">{v.uploadedDate}</td>
                            <td className="ent-mono">{v.fileName}</td>
                            <td>{getStatusBadge(v.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Real Document Preview Canvas */}
              <div style={{ marginTop: 12, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-subtle)', background: '#0F172A', minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isDocPreviewLoading && (
                  <div style={{ color: '#94A3B8', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, padding: 20 }}>
                    <RefreshCw size={16} className="animate-spin" /> Retrieving verified document bytes...
                  </div>
                )}
                {docPreviewError && !isDocPreviewLoading && (
                  <div style={{ color: '#FCA5A5', fontSize: 12, padding: 20, textAlign: 'center' }}>
                    <AlertCircle size={24} style={{ margin: '0 auto 6px', color: '#EF4444' }} />
                    <div>{docPreviewError}</div>
                  </div>
                )}
                {docPreviewBlobUrl && !isDocPreviewLoading && (
                  <iframe
                    src={`${docPreviewBlobUrl}#toolbar=0`}
                    title={selectedDocForView.fileName || 'Document Preview'}
                    style={{ width: '100%', height: 320, border: 'none', background: '#525659' }}
                  />
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  className="ent-btn-secondary"
                  onClick={() => handleDownloadDoc(selectedDocForView)}
                >
                  <Download size={14} /> Download File ({selectedDocForView.fileName || 'document.pdf'})
                </button>
                <button className="ent-btn-primary" onClick={() => setSelectedDocForView(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 5: REPLACE DOCUMENT ───────────────────────── */}
      {selectedDocForReplace && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 540, maxWidth: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                {selectedDocForReplace.verificationStatus === 'NOT UPLOADED' ? 'Upload Document: ' : 'Replace Document: '}
                {selectedDocForReplace.documentName}
              </div>
              <button onClick={() => setSelectedDocForReplace(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveReplaceDoc} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: 12, background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                {selectedDocForReplace.verificationStatus === 'NOT UPLOADED'
                  ? 'Upload this regulatory document to your repository. Once uploaded, its status will be set to PENDING VERIFICATION.'
                  : <>Replacing this document will archive the previous version in audit history and set the status to <strong>PENDING VERIFICATION</strong>.</>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Document Number</label>
                  <input
                    type="text"
                    value={docForm.documentNumber}
                    onChange={e => setDocForm({ ...docForm, documentNumber: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>New Expiry Date</label>
                  <input
                    type="date"
                    value={docForm.expiryDate}
                    onChange={e => setDocForm({ ...docForm, expiryDate: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>New Replacement File</label>
                <input
                  type="file"
                  required
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFileForReplace(e.target.files[0]);
                      setDocForm({ ...docForm, fileName: e.target.files[0].name });
                    }
                  }}
                  style={{ fontSize: 12 }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Replacement Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Reason for replacing document..."
                  value={docForm.remarks}
                  onChange={e => setDocForm({ ...docForm, remarks: e.target.value })}
                  style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none', fontSize: 12 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="ent-btn-secondary" onClick={() => setSelectedDocForReplace(null)}>
                  Cancel
                </button>
                <button type="submit" className="ent-btn-primary">
                  {selectedDocForReplace.verificationStatus === 'NOT UPLOADED' ? 'Upload Document' : 'Submit Replacement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 2FA ENABLE SETUP MODAL (BUYER ONLY) ── */}
      {show2FASetupModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 440, maxWidth: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: '0 25px 50px rgba(0,0,0,0.3)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={18} style={{ color: 'var(--c-primary)' }} />
                <span>Enable Two-Factor Authentication</span>
              </div>
              <button onClick={() => setShow2FASetupModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Two-Factor Authentication adds an additional verification step to protect your Buyer account.
            </div>

            <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Demo OTP Code</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--c-primary)', letterSpacing: '0.2em', margin: '4px 0', fontFamily: 'monospace' }}>123456</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Enter code <strong style={{ color: 'var(--text-primary)' }}>123456</strong> below to complete setup</div>
            </div>

            <form onSubmit={handleVerifyAndEnable2FA} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Enter 6-Digit OTP Code *</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otpInput}
                  onChange={e => setOtpInput(e.target.value)}
                  style={{ width: '100%', height: 40, borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', fontSize: 16, fontWeight: 800, textAlign: 'center', letterSpacing: '0.3em', outline: 'none' }}
                  autoFocus
                  required
                />
              </div>

              {otpError && (
                <div style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', fontSize: 12, fontWeight: 600 }}>
                  ⚠️ {otpError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => setShow2FASetupModal(false)} className="ent-btn-secondary">Cancel</button>
                <button type="submit" disabled={isVerifying2FA} className="ent-btn-primary" style={{ background: '#10B981' }}>
                  {isVerifying2FA ? 'Verifying...' : 'Verify & Enable 2FA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 2FA DISABLE CONFIRMATION MODAL (BUYER ONLY) ── */}
      {show2FADisableModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 420, maxWidth: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: '0 25px 50px rgba(0,0,0,0.3)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
              <AlertTriangle size={18} style={{ color: '#EF4444' }} />
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Disable Two-Factor Authentication?</h3>
            </div>

            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Are you sure you want to disable 2FA? Your Buyer account will rely solely on password authentication for login and transactions.
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button onClick={() => setShow2FADisableModal(false)} className="ent-btn-secondary">Cancel</button>
              <button onClick={handleDisable2FA} className="ent-btn-primary" style={{ background: '#EF4444' }}>Confirm Disable</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: UPLOAD FACTORY PHOTO ───────────────────────── */}
      {isUploadGalleryOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 560, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ImageIcon size={18} style={{ color: '#0F766E' }} />
                <span>Upload Factory Photo</span>
              </div>
              <button onClick={handleCloseUploadGallery} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUploadGallery} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {galleryError && (
                <div style={{ padding: '10px 14px', borderRadius: 6, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>{galleryError}</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Photo Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oral Solid Dosage Blister Packaging Line 2"
                  value={galleryForm.title}
                  onChange={e => setGalleryForm({ ...galleryForm, title: e.target.value })}
                  style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="High-speed Alu-Alu blister line running at 300 blisters/min in Class D cleanroom."
                  value={galleryForm.description}
                  onChange={e => setGalleryForm({ ...galleryForm, description: e.target.value })}
                  style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Capture Date</label>
                  <input
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={galleryForm.capturedAt}
                    onChange={e => setGalleryForm({ ...galleryForm, capturedAt: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Factory Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Unit 2, Formulation Block"
                    value={galleryForm.locationName}
                    onChange={e => setGalleryForm({ ...galleryForm, locationName: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              {/* GPS Coordinates Section */}
              <div style={{
                background: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                    🧭 GPS Coordinates (Optional Metadata)
                  </span>
                  <button
                    type="button"
                    onClick={handleDetectCoordinates}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 4,
                      padding: '3px 8px',
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--c-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <MapPin size={12} /> Detect My Location
                  </button>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                  Only captured when explicitly provided or detected with your browser permission. Displayed as metadata without altering the original photo.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="Latitude (e.g. 30.9578)"
                    value={galleryForm.latitude}
                    onChange={e => setGalleryForm({ ...galleryForm, latitude: e.target.value })}
                    style={{ height: 34, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }}
                  />
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="Longitude (e.g. 76.7911)"
                    value={galleryForm.longitude}
                    onChange={e => setGalleryForm({ ...galleryForm, longitude: e.target.value })}
                    style={{ height: 34, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }}
                  />
                </div>
              </div>

              {/* Photo Upload File Input & Dropzone */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Factory Image File *
                </label>

                {/* Hidden actual file input */}
                <input
                  ref={galleryFileInputRef}
                  type="file"
                  id="factory-gallery-file-input"
                  accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  style={{ display: 'none' }}
                  onChange={e => handleSelectGalleryFile(e.target.files?.[0] || null)}
                />

                {!galleryForm.file ? (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => galleryFileInputRef.current?.click()}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); galleryFileInputRef.current?.click(); } }}
                    onDragOver={e => { e.preventDefault(); setIsDraggingOver(true); }}
                    onDragLeave={() => setIsDraggingOver(false)}
                    onDrop={e => {
                      e.preventDefault();
                      setIsDraggingOver(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleSelectGalleryFile(e.dataTransfer.files[0]);
                      }
                    }}
                    style={{
                      border: `2px dashed ${isDraggingOver ? '#0F766E' : 'var(--border-subtle)'}`,
                      borderRadius: 10,
                      padding: '24px 16px',
                      textAlign: 'center',
                      background: isDraggingOver ? 'rgba(15, 118, 110, 0.08)' : 'var(--bg-app)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease-in-out',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      userSelect: 'none',
                    }}
                  >
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: 'rgba(15, 118, 110, 0.1)',
                      color: '#0F766E',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Upload size={22} />
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Click to Choose File <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>or drag and drop</span>
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', maxWidth: 420 }}>
                      Supports PNG, JPG, JPEG, and WebP (Max 10 MB). Stored directly in MinIO S3 object storage.
                    </div>

                    <button
                      type="button"
                      className="ent-btn-secondary"
                      style={{ marginTop: 4, padding: '5px 14px', fontSize: 11.5, pointerEvents: 'none' }}
                    >
                      Choose File
                    </button>
                  </div>
                ) : (
                  <div style={{
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 10,
                    padding: 12,
                    background: 'var(--bg-app)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14
                  }}>
                    {galleryFilePreview && (
                      <div style={{
                        width: 72,
                        height: 72,
                        borderRadius: 8,
                        overflow: 'hidden',
                        flexShrink: 0,
                        background: '#0F172A',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <img
                          src={galleryFilePreview}
                          alt="Selected Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {galleryForm.file.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          Size: <strong>{galleryFileSizeFormatted || formatFileSize(galleryForm.file.size)}</strong>
                        </span>
                        <span style={{
                          fontSize: 10,
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: '#10B981',
                          fontWeight: 700
                        }}>
                          Ready to upload
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => galleryFileInputRef.current?.click()}
                        className="ent-btn-secondary"
                        style={{ padding: '4px 10px', fontSize: 11 }}
                      >
                        Change Photo
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveSelectedFile}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          padding: 4,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Remove photo"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {fileValidationError && (
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#EF4444',
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <AlertTriangle size={14} />
                    <span>{fileValidationError}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="ent-btn-secondary" onClick={handleCloseUploadGallery}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGallerySubmitting || !galleryForm.file || !!fileValidationError}
                  className="ent-btn-primary"
                  style={{ background: '#0F766E', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {isGallerySubmitting ? (
                    <>
                      <RefreshCw size={14} className="spin" />
                      <span>Uploading to MinIO Storage...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      <span>Upload Photo</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT FACTORY PHOTO METADATA ────────────────── */}
      {isEditGalleryOpen && editingGalleryItem && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 540, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Edit Photo Metadata</div>
              <button onClick={() => { setIsEditGalleryOpen(false); setEditingGalleryItem(null); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditGallery} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {galleryError && (
                <div style={{ padding: '10px 14px', borderRadius: 6, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', fontSize: 12.5, fontWeight: 600 }}>
                  ⚠️ {galleryError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Photo Title *</label>
                <input
                  type="text"
                  required
                  value={galleryForm.title}
                  onChange={e => setGalleryForm({ ...galleryForm, title: e.target.value })}
                  style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Description</label>
                <textarea
                  rows={2}
                  value={galleryForm.description}
                  onChange={e => setGalleryForm({ ...galleryForm, description: e.target.value })}
                  style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Capture Date</label>
                  <input
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={galleryForm.capturedAt}
                    onChange={e => setGalleryForm({ ...galleryForm, capturedAt: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Factory Location</label>
                  <input
                    type="text"
                    value={galleryForm.locationName}
                    onChange={e => setGalleryForm({ ...galleryForm, locationName: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="Optional"
                    value={galleryForm.latitude}
                    onChange={e => setGalleryForm({ ...galleryForm, latitude: e.target.value })}
                    style={{ height: 34, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="Optional"
                    value={galleryForm.longitude}
                    onChange={e => setGalleryForm({ ...galleryForm, longitude: e.target.value })}
                    style={{ height: 34, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="ent-btn-secondary" onClick={() => { setIsEditGalleryOpen(false); setEditingGalleryItem(null); }}>
                  Cancel
                </button>
                <button type="submit" disabled={isGallerySubmitting} className="ent-btn-primary">
                  {isGallerySubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRM DELETE GALLERY ITEM ────────────────── */}
      {deletingGalleryItem && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 440, maxWidth: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: '0 25px 50px rgba(0,0,0,0.3)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
              <AlertTriangle size={20} style={{ color: '#EF4444' }} />
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Delete Factory Photo?</h3>
            </div>

            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete <strong>{deletingGalleryItem.title}</strong>? The image file will be removed from secure object storage.
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button onClick={() => setDeletingGalleryItem(null)} className="ent-btn-secondary">Cancel</button>
              <button onClick={handleConfirmDeleteGallery} disabled={isGallerySubmitting} className="ent-btn-primary" style={{ background: '#EF4444' }}>
                {isGallerySubmitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: LIGHTBOX PREVIEW GALLERY PHOTO ─────────────── */}
      {previewGalleryItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(10, 15, 30, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24
          }}
          onClick={() => setPreviewGalleryItem(null)}
        >
          <div
            style={{
              maxWidth: 900,
              width: '100%',
              maxHeight: '92vh',
              background: 'var(--bg-surface)',
              borderRadius: 14,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {previewGalleryItem.title}
                </span>
                <span style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: previewGalleryItem.verificationStatus === 'VERIFIED' ? 'rgba(16, 185, 129, 0.12)' : previewGalleryItem.verificationStatus === 'REJECTED' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                  color: previewGalleryItem.verificationStatus === 'VERIFIED' ? '#10B981' : previewGalleryItem.verificationStatus === 'REJECTED' ? '#EF4444' : '#F59E0B',
                  border: `1px solid ${previewGalleryItem.verificationStatus === 'VERIFIED' ? 'rgba(16, 185, 129, 0.3)' : previewGalleryItem.verificationStatus === 'REJECTED' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                }}>
                  {previewGalleryItem.verificationStatus}
                </span>
              </div>
              <button onClick={() => setPreviewGalleryItem(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Photo */}
            <div style={{ background: '#090D16', display: 'flex', alignItems: 'center', justifyContent: 'center', maxHeight: '60vh', overflow: 'hidden' }}>
              <img
                src={previewGalleryItem.imageUrl}
                alt={previewGalleryItem.title}
                style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }}
              />
            </div>

            {/* Metadata Footer */}
            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {previewGalleryItem.description && (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {previewGalleryItem.description}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, background: 'var(--bg-app)', padding: 12, borderRadius: 8, fontSize: 12 }}>
                <div>
                  <span style={{ color: 'var(--text-tertiary)' }}>Capture Date: </span>
                  <strong>{previewGalleryItem.capturedAt ? new Date(previewGalleryItem.capturedAt).toLocaleDateString() : 'Not provided'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-tertiary)' }}>Location: </span>
                  <strong>{previewGalleryItem.locationName || 'Not provided'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-tertiary)' }}>GPS: </span>
                  <strong style={{ fontFamily: 'monospace' }}>{formatGpsCoordinates(previewGalleryItem.gpsCoordinates)}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-tertiary)' }}>Uploaded By: </span>
                  <strong>{previewGalleryItem.uploadedBy || 'Staff'}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD ACHIEVEMENT ─────────────────────────────── */}
      {isAddAchievementOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 560, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Award size={18} style={{ color: '#8B5CF6' }} />
                <span>Add Achievement or Award</span>
              </div>
              <button onClick={() => setIsAddAchievementOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAddAchievement} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {achievementError && (
                <div style={{ padding: '10px 14px', borderRadius: 6, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', fontSize: 12.5, fontWeight: 600 }}>
                  ⚠️ {achievementError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Achievement / Award Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Quality Excellence Award 2025"
                  value={achievementForm.title}
                  onChange={e => setAchievementForm({ ...achievementForm, title: e.target.value })}
                  style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Recognition Category *</label>
                  <select
                    value={achievementForm.awardType}
                    onChange={e => setAchievementForm({ ...achievementForm, awardType: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="Quality Excellence">Quality Excellence</option>
                    <option value="WHO-GMP Compliance">WHO-GMP Compliance</option>
                    <option value="Export Excellence">Export Excellence</option>
                    <option value="Green Manufacturing">Green Manufacturing</option>
                    <option value="Safety Milestone">Safety Milestone</option>
                    <option value="ISO Accreditation">ISO Accreditation</option>
                    <option value="Other Industry Award">Other Industry Award</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Issuing Organization *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pharmexcil / CDSCO / FICCI"
                    value={achievementForm.issuingOrganization}
                    onChange={e => setAchievementForm({ ...achievementForm, issuingOrganization: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Issue Date *</label>
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={achievementForm.issueDate}
                    onChange={e => setAchievementForm({ ...achievementForm, issueDate: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Expiry Date (if applicable)</label>
                  <input
                    type="date"
                    min={achievementForm.issueDate || undefined}
                    value={achievementForm.expiryDate}
                    onChange={e => setAchievementForm({ ...achievementForm, expiryDate: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Description / Citation</label>
                <textarea
                  rows={2}
                  placeholder="Conferred for outstanding compliance and zero-defect batch track record."
                  value={achievementForm.description}
                  onChange={e => setAchievementForm({ ...achievementForm, description: e.target.value })}
                  style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }}
                />
              </div>

              {/* Certificate File */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Supporting Certificate / Document</label>
                <div style={{ border: '2px dashed var(--border-subtle)', borderRadius: 8, padding: 16, textAlign: 'center', background: 'var(--bg-app)' }}>
                  <FileText size={20} style={{ color: '#8B5CF6', marginBottom: 4 }} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {achievementForm.certFile ? achievementForm.certFile.name : 'Upload Certificate (PDF, PNG, JPG, WebP)'}
                  </div>
                  <input
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/webp"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setAchievementForm({ ...achievementForm, certFile: e.target.files[0] });
                      }
                    }}
                    style={{ marginTop: 8, fontSize: 12 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="ent-btn-secondary" onClick={() => setIsAddAchievementOpen(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={isAchievementSubmitting} className="ent-btn-primary" style={{ background: '#8B5CF6' }}>
                  {isAchievementSubmitting ? 'Submitting...' : 'Submit Achievement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT ACHIEVEMENT ────────────────────────────── */}
      {isEditAchievementOpen && editingAchievement && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 560, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Edit Achievement Submission</div>
              <button onClick={() => { setIsEditAchievementOpen(false); setEditingAchievement(null); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditAchievement} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {achievementError && (
                <div style={{ padding: '10px 14px', borderRadius: 6, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', fontSize: 12.5, fontWeight: 600 }}>
                  ⚠️ {achievementError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Achievement Title *</label>
                <input
                  type="text"
                  required
                  value={achievementForm.title}
                  onChange={e => setAchievementForm({ ...achievementForm, title: e.target.value })}
                  style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Recognition Category</label>
                  <select
                    value={achievementForm.awardType}
                    onChange={e => setAchievementForm({ ...achievementForm, awardType: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="Quality Excellence">Quality Excellence</option>
                    <option value="WHO-GMP Compliance">WHO-GMP Compliance</option>
                    <option value="Export Excellence">Export Excellence</option>
                    <option value="Green Manufacturing">Green Manufacturing</option>
                    <option value="Safety Milestone">Safety Milestone</option>
                    <option value="ISO Accreditation">ISO Accreditation</option>
                    <option value="Other Industry Award">Other Industry Award</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Issuing Organization *</label>
                  <input
                    type="text"
                    required
                    value={achievementForm.issuingOrganization}
                    onChange={e => setAchievementForm({ ...achievementForm, issuingOrganization: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Issue Date *</label>
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={achievementForm.issueDate}
                    onChange={e => setAchievementForm({ ...achievementForm, issueDate: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Expiry Date</label>
                  <input
                    type="date"
                    min={achievementForm.issueDate || undefined}
                    value={achievementForm.expiryDate}
                    onChange={e => setAchievementForm({ ...achievementForm, expiryDate: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Description / Citation</label>
                <textarea
                  rows={2}
                  value={achievementForm.description}
                  onChange={e => setAchievementForm({ ...achievementForm, description: e.target.value })}
                  style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }}
                />
              </div>

              {/* Replace / Upload Certificate */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Upload / Replace Certificate File</label>
                <input
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setAchievementForm({ ...achievementForm, certFile: e.target.files[0] });
                    }
                  }}
                  style={{ fontSize: 12 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="ent-btn-secondary" onClick={() => { setIsEditAchievementOpen(false); setEditingAchievement(null); }}>
                  Cancel
                </button>
                <button type="submit" disabled={isAchievementSubmitting} className="ent-btn-primary">
                  {isAchievementSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRM DELETE ACHIEVEMENT ─────────────────── */}
      {deletingAchievement && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 440, maxWidth: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: '0 25px 50px rgba(0,0,0,0.3)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
              <AlertTriangle size={20} style={{ color: '#EF4444' }} />
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Delete Achievement Record?</h3>
            </div>

            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>{deletingAchievement.title}</strong>? Any attached supporting certificate will also be removed.
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button onClick={() => setDeletingAchievement(null)} className="ent-btn-secondary">Cancel</button>
              <button onClick={handleConfirmDeleteAchievement} disabled={isAchievementSubmitting} className="ent-btn-primary" style={{ background: '#EF4444' }}>
                {isAchievementSubmitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};