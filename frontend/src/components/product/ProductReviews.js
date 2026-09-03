import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { addProductReview } from '../../store/slices/productSlice';
import { useLanguage } from '../../context/LanguageContext';

function getReviewAuthor(review, visitorLabel) {
  if (review.user?.firstName) {
    return `${review.user.firstName} ${review.user.lastName || ''}`.trim();
  }
  return review.guestName || visitorLabel;
}

function StarRating({ value, onChange, readonly = false, size = 'md' }) {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-6 w-6';

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        const Icon = filled ? StarIcon : StarOutlineIcon;
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange?.(star)}
            className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
            aria-label={`${star} star`}
          >
            <Icon className={`${sizeClass} ${filled ? 'text-yellow-400' : 'text-gray-300'}`} />
          </button>
        );
      })}
    </div>
  );
}

const ProductReviews = ({ productId, reviews = [], rating = { average: 0, count: 0 } }) => {
  const dispatch = useDispatch();
  const { t, language } = useLanguage();
  const { user } = useSelector((state) => state.auth || {});

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const displayName = useMemo(() => {
    if (user?.firstName) {
      return `${user.firstName} ${user.lastName || ''}`.trim();
    }
    return guestName;
  }, [user, guestName]);

  const sortedReviews = useMemo(
    () => [...reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [reviews]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stars) {
      toast.error(t('selectRatingError'));
      return;
    }
    if (!user && !guestName.trim()) {
      toast.error(t('enterFirstNameError'));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        rating: stars,
        comment: comment.trim(),
      };
      if (!user) {
        payload.guestName = guestName.trim();
        if (guestEmail.trim()) payload.guestEmail = guestEmail.trim();
      }

      await dispatch(addProductReview({ productId, reviewData: payload })).unwrap();
      toast.success(t('thankYouReview'));
      setComment('');
      if (!user) {
        setGuestName('');
        setGuestEmail('');
      }
      setStars(5);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : t('cannotPublishReview'));
    } finally {
      setSubmitting(false);
    }
  };

  const visitorLabel = language === 'ar' ? 'زائر' : 'Visiteur';

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">{t('customerReviews')}</h2>

      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-3">
              <StarRating value={Math.round(rating.average || 0)} readonly size="md" />
              <span className="text-2xl font-bold text-gray-900">
                {(rating.average || 0).toFixed(1)}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {rating.count || 0} {t('reviewsCount')}
            </p>
          </div>
        </div>

        {sortedReviews.length > 0 ? (
          <ul className="space-y-6">
            {sortedReviews.map((review, index) => (
              <li key={review._id || `${getReviewAuthor(review, visitorLabel)}-${index}`} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="font-semibold text-gray-900">{getReviewAuthor(review, visitorLabel)}</span>
                  <span className="text-xs text-gray-400">
                    {review.createdAt
                      ? new Date(review.createdAt).toLocaleDateString(language === 'ar' ? 'ar-TN' : 'fr-FR')
                      : ''}
                  </span>
                </div>
                <StarRating value={review.rating} readonly size="sm" />
                {review.comment ? (
                  <p className="text-gray-600 mt-3 text-sm leading-relaxed">{review.comment}</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center italic">{t('beFirstReview')}</p>
        )}

        <form onSubmit={handleSubmit} className="pt-6 border-t border-gray-100 space-y-4">
          <h3 className="font-semibold text-gray-900">{t('leaveReviewOptional')}</h3>

          {!user && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('yourFirstName')} *</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder={t('yourFirstNamePlaceholder')}
                  maxLength={80}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('emailOptional')}</label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder={t('emailPlaceholder')}
                />
              </div>
            </div>
          )}

          {user && (
            <p className="text-sm text-gray-600">
              {t('connectedAs')} <strong>{displayName}</strong>
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('yourRating')}</label>
            <StarRating value={stars} onChange={setStars} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('commentOptional')}</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder={t('commentPlaceholder')}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            {submitting ? t('publishingReview') : t('publishReview')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProductReviews;
