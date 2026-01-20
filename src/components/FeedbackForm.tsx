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
      className="mt-4 p-5 bg-card border border-border rounded-xl"
    >
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h4 className="font-semibold text-foreground">Share Your Feedback</h4>
      </div>

      {/* Star rating */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-3">How was your support experience?</p>
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
                  'w-8 h-8 transition-colors',
                  (hoveredRating || rating) >= star
                    ? 'fill-warning text-warning'
                    : 'fill-muted text-muted-foreground'
                )}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground mt-2"
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
        <p className="text-sm text-muted-foreground mb-2">Any additional comments? (optional)</p>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us more about your experience..."
          className="resize-none h-24"
        />
      </div>

      {/* Submit button */}
      <Button
        onClick={handleSubmit}
        disabled={rating === 0 || isSubmitting}
        className="w-full gap-2 gradient-primary hover:opacity-90"
      >
        <Send className="w-4 h-4" />
        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </Button>
    </motion.div>
  );
}
