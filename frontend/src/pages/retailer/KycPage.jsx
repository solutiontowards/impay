import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FileUpload } from '../../components/FileUpload';
import { submitKyc, getMyKycDetails } from '../../api/retailer';
import { uploadSingle } from '../../api/upload';
import { Loader2, AlertTriangle, CheckCircle, Info, MapPin } from 'lucide-react';
import Swal from 'sweetalert2';

const KycPage = () => {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();
  const [pageLoading, setPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [kycData, setKycData] = useState(null);
  const navigate = useNavigate();

  // ⭐ FETCH KYC DETAILS
  useEffect(() => {
    async function fetchKycStatus() {
      try {
        const { data } = await getMyKycDetails();
        setKycData(data);

        const fileFields = ['aadhaarFront', 'aadhaarBack', 'panCardImage', 'photo', 'bankDocument'];

        if (data.details) {
          Object.keys(data.details).forEach(key => {
            if (!fileFields.includes(key) && key !== 'status' && key !== 'rejectionReason') {
              setValue(key, data.details[key]);
            }
          });

          // ⭐ Prefill Aadhaar last 4 digits
          if (data.details?.aadhaarNumber) {
            const last4 = data.details.aadhaarNumber.slice(-4);
            setValue('aadhaarLast4', last4);
          }
        }
      } catch (error) {
        toast.error('Failed to load your KYC status.');
      } finally {
        setPageLoading(false);
      }
    }
    fetchKycStatus();
  }, [setValue]);

  // ⭐ LOCATION FETCH
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported.");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setValue('plusCode', `${latitude}, ${longitude}`);
        setLocationLoading(false);
        toast.success("Location captured successfully!");
      },
      () => {
        toast.error("Unable to fetch location.");
        setLocationLoading(false);
      }
    );
  };

  // ⭐ SUBMIT
  const onSubmit = async (formData) => {
    setIsSubmitting(true);

    Swal.fire({
      title: 'Submitting KYC...',
      text: 'Uploading documents...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      // ⭐ Build full Aadhaar number
      formData.aadhaarNumber = `XXXXXXXX${formData.aadhaarLast4}`;

      const payload = { ...formData };
      delete payload.aadhaarLast4;

      const fileFields = ['aadhaarFront', 'aadhaarBack', 'panCardImage', 'photo', 'bankDocument'];
      const uploadPromises = [];

      for (const field of fileFields) {
        if (formData[field]?.[0]) {
          const upload = uploadSingle(formData[field][0]).then(res => {
            payload[field] = res.data.url;
          });
          uploadPromises.push(upload);
        } else {
          payload[field] = kycData?.details?.[field] || null;
        }
        if (field === 'bankDocument' && !payload[field]) delete payload[field];
      }

      await Promise.all(uploadPromises);
      await submitKyc(payload);

      Swal.fire({
        title: 'Success!',
        text: 'KYC submitted successfully.',
        icon: 'success',
        confirmButtonText: 'Go to Dashboard'
      }).then(() => navigate('/retailer/dashboard'));

    } catch (error) {
      Swal.fire({
        title: 'Failed',
        text: error.response?.data?.message || 'Something went wrong.',
        icon: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ⭐ Loading Screen
  if (pageLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
      </div>
    );
  }

  // ⭐ Approved
  if (kycData?.kycStatus === 'approved') {
    return (
      <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-md text-center mt-10">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">KYC Verified</h2>
        <p className="text-gray-600 mt-2">Your KYC is approved.</p>
      </div>
    );
  }

  // ⭐ Pending
  if (kycData?.kycStatus === 'pending') {
    return (
      <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-md text-center mt-10">
        <Info className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">KYC Under Review</h2>
        <p className="text-gray-600 mt-2">Your documents are being reviewed.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-lg">

        <h1 className="text-3xl font-bold text-gray-800 mb-2">KYC Verification</h1>
        <p className="text-gray-600 mb-6">Please submit valid details.</p>

        {/* Rejected Warning */}
        {kycData?.kycStatus === 'rejected' && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 mb-6 rounded-r-lg">
            <p className="font-bold flex items-center gap-2">
              <AlertTriangle size={20} /> KYC Rejected
            </p>
            <p className="mt-1">
              Reason: <span className="font-semibold">{kycData.details.rejectionReason}</span>
            </p>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

          {/* Personal Info */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Personal Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Outlet Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Outlet Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('outletName', { required: 'Outlet name is required' })}
                  className="mt-1 block w-full border p-2 rounded-md"
                />
                {errors.outletName && <p className="text-red-500 text-xs">{errors.outletName.message}</p>}
              </div>

              {/* ⭐ NEW MASKED AADHAAR INPUT */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Aadhaar Number <span className="text-red-500">*</span>
                </label>

                <div className="flex items-center gap-2 mt-1">
                  <div className="px-3 py-2 bg-gray-200 rounded-md text-gray-600 font-mono">
                    XXXX XXXX
                  </div>

                  <input
                    type="text"
                    maxLength={4}
                    {...register('aadhaarLast4', {
                      required: 'Enter last 4 digits',
                      pattern: { value: /^[0-9]{4}$/, message: 'Must be 4 digits' }
                    })}
                    placeholder="1234"
                    className="w-24 border p-2 rounded-md text-center"
                  />
                </div>

                {errors.aadhaarLast4 && (
                  <p className="text-red-500 text-xs">{errors.aadhaarLast4.message}</p>
                )}
              </div>

              {/* PAN */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  PAN Number <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  maxLength={10}     // ⭐ allow 10 characters freely
                  {...register('panNumber', {
                    required: 'PAN is required',
                    // validate: value => {
                    //   const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
                    //   return panRegex.test(value.toUpperCase()) || "Invalid PAN format";
                    // }
                  })}
                  onInput={(e) => e.target.value = e.target.value.toUpperCase()} // ⭐ auto uppercase
                  className="mt-1 block w-full border p-2 rounded-md uppercase"
                  placeholder="ABCDE1234F"
                />

                {errors.panNumber && (
                  <p className="text-red-500 text-xs">{errors.panNumber.message}</p>
                )}
              </div>


            </div>
          </div>

          {/* Address Section */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Outlet Address</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* State */}
              <div>
                <label className="block text-sm font-medium text-gray-700">State *</label>
                <input type="text" {...register('state', { required: 'State required' })} className="mt-1 block w-full border p-2 rounded-md" />
                {errors.state && <p className="text-red-500 text-xs">{errors.state.message}</p>}
              </div>

              {/* District */}
              <div>
                <label className="block text-sm font-medium text-gray-700">District *</label>
                <input type="text" {...register('district', { required: 'District required' })} className="mt-1 block w-full border p-2 rounded-md" />
                {errors.district && <p className="text-red-500 text-xs">{errors.district.message}</p>}
              </div>

              {/* Post Office */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Post Office *</label>
                <input type="text" {...register('postOffice', { required: 'Post Office required' })} className="mt-1 block w-full border p-2 rounded-md" />
                {errors.postOffice && <p className="text-red-500 text-xs">{errors.postOffice.message}</p>}
              </div>

              {/* PIN */}
              <div>
                <label className="block text-sm font-medium text-gray-700">PIN Code *</label>
                <input
                  type="text"
                  {...register('pinCode', { required: 'PIN required', pattern: { value: /^\d{6}$/, message: 'Must be 6 digits' } })}
                  className="mt-1 block w-full border p-2 rounded-md"
                />
                {errors.pinCode && <p className="text-red-500 text-xs">{errors.pinCode.message}</p>}
              </div>

              {/* Full Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Full Address *</label>
                <textarea {...register('address', { required: 'Address required' })} className="mt-1 block w-full border p-2 rounded-md" rows={3}></textarea>
                {errors.address && <p className="text-red-500 text-xs">{errors.address.message}</p>}
              </div>

              {/* Live Location */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Live Location (Plus Code) *</label>
                <div className="flex items-center gap-2 mt-1">
                  <input readOnly {...register('plusCode', { required: 'Location required' })} className="w-full border p-2 rounded-md bg-gray-100" />
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={locationLoading}
                    className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg"
                  >
                    {locationLoading ? <Loader2 className="animate-spin" size={16} /> : <MapPin size={16} />}
                  </button>
                </div>
                {errors.plusCode && <p className="text-red-500 text-xs">{errors.plusCode.message}</p>}
              </div>

            </div>
          </div>

          {/* FILE UPLOADS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileUpload label="Aadhaar Front Page" name="aadhaarFront" register={register} error={errors.aadhaarFront} watch={watch} setValue={setValue} required={!kycData?.details?.aadhaarFront} existingFileUrl={kycData?.details?.aadhaarFront} />

            <FileUpload label="Aadhaar Back Page" name="aadhaarBack" register={register} error={errors.aadhaarBack} watch={watch} setValue={setValue} required={!kycData?.details?.aadhaarBack} existingFileUrl={kycData?.details?.aadhaarBack} />

            <FileUpload label="PAN Card Image" name="panCardImage" register={register} error={errors.panCardImage} watch={watch} setValue={setValue} required={!kycData?.details?.panCardImage} existingFileUrl={kycData?.details?.panCardImage} />

            <FileUpload label="Your Photo" name="photo" register={register} error={errors.photo} watch={watch} setValue={setValue} required={!kycData?.details?.photo} existingFileUrl={kycData?.details?.photo} />

            <FileUpload label="Shop Photo" name="bankDocument" register={register} error={errors.bankDocument} watch={watch} setValue={setValue} existingFileUrl={kycData?.details?.bankDocument} />
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-3 rounded-lg">
            {isSubmitting ? <Loader2 className="animate-spin" /> : "Submit for Verification"}
          </button>

        </form>
      </div>
    </div>
  );
};

export default KycPage;
