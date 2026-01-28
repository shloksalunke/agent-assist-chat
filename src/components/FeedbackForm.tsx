import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface FeedbackFormProps {
  onSubmit: (rating: number, comment?: string) => void;
}

export function FeedbackForm({ onSubmit }: FeedbackFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    setIsSubmitting(true);
    await onSubmit(rating, comment || undefined);
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-5 glass rounded-2xl shadow-lg"
    >
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-cyan-400" />
        <h4 className="font-semibold text-white">Share Your Feedback</h4>
      </div>

      {/* Star rating */}
      <div className="mb-4">
        <p className="text-sm text-gray-300 mb-3">How was your support experience?</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110 focus:outline-none focus:scale-110"
            >
              <Star
                className={cn(
                  'w-8 h-8 transition-colors duration-200',
                  (hoveredRating || rating) >= star
                    ? 'fill-yellow-400 text-yellow-400 shadow-md shadow-yellow-500/30'
                    : 'fill-gray-700 text-gray-600'
                )}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-gray-300 mt-2"
          >
            {rating === 5 && "Excellent! We're thrilled to hear that! 🎉"}
            {rating === 4 && "Great! Thanks for the positive feedback! 😊"}
            {rating === 3 && "Thanks! We'll work on improving. 👍"}
            {rating === 2 && "We're sorry. Please tell us how we can do better."}
            {rating === 1 && "We apologize for the experience. Your feedback helps us improve."}
          </motion.p>
        )}
      </div>

      {/* Optional comment */}
      <div className="mb-4">
        <p className="text-sm text-gray-300 mb-2">Any additional comments? (optional)</p>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us more about your experience..."
          className="resize-none h-24 glass-light border-0 focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder-gray-400"
        />
      </div>

      {/* Submit button */}
      <Button
        onClick={handleSubmit}
        disabled={rating === 0 || isSubmitting}
        className="w-full gap-2 gradient-primary shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover-lift"
      >
        <Send className="w-4 h-4" />
        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </Button>
    </motion.div>
  );
}