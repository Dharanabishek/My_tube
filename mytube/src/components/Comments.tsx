import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { Languages, MapPin, ThumbsDown, ThumbsUp } from "lucide-react";

interface Comment {
  _id: string;
  videoid: string;
  userid: string;
  commentbody: string;
  usercommented: string;
  city?: string;
  likedBy?: string[];
  dislikedBy?: string[];
  commentedon: string;
}

const languageOptions = [
  { label: "English", value: "en" },
  { label: "Hindi", value: "hi" },
  { label: "Tamil", value: "ta" },
  { label: "Telugu", value: "te" },
  { label: "Malayalam", value: "ml" },
  { label: "Kannada", value: "kn" },
  { label: "Spanish", value: "es" },
  { label: "French", value: "fr" },
];

const hasBlockedCharacters = (text: string) => {
  return /[^\p{L}\p{N}\s.,!?'"()-]/u.test(text);
};

const Comments = ({ videoId }: any) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [cityName, setCityName] = useState("Unknown city");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [translatedComments, setTranslatedComments] = useState<
    Record<string, string>
  >({});
  const [translatingCommentId, setTranslatingCommentId] = useState<
    string | null
  >(null);

  useEffect(() => {
    loadComments();
  }, [videoId]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await res.json();
          setCityName(
            data.city ||
              data.locality ||
              data.principalSubdivision ||
              "Unknown city"
          );
        } catch (error) {
          console.log(error);
        }
      },
      () => setCityName("Unknown city"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const loadComments = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/comment/${videoId}`);
      setComments(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    if (hasBlockedCharacters(newComment)) {
      setCommentError(
        "Special characters are not allowed. Use letters, numbers, spaces, and basic punctuation only."
      );
      return;
    }

    setIsSubmitting(true);
    setCommentError("");
    try {
      const res = await axiosInstance.post("/comment/postcomment", {
        videoid: videoId,
        userid: user._id,
        commentbody: newComment,
        usercommented: user.name,
        city: cityName,
      });
      if (res.data.comment) {
        setComments([res.data.result, ...comments]);
      }
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
      setCommentError(
        "Could not post this comment. Check for blocked characters and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingCommentId(comment._id);
    setEditText(comment.commentbody);
  };

  const handleUpdateComment = async () => {
    if (!editText.trim()) return;
    if (hasBlockedCharacters(editText)) {
      setCommentError(
        "Special characters are not allowed. Use letters, numbers, spaces, and basic punctuation only."
      );
      return;
    }

    try {
      const res = await axiosInstance.post(
        `/comment/editcomment/${editingCommentId}`,
        { commentbody: editText }
      );
      if (res.data) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === editingCommentId ? { ...c, commentbody: editText } : c
          )
        );
        setEditingCommentId(null);
        setEditText("");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleReaction = async (commentId: string, action: "like" | "dislike") => {
    if (!user) return;

    try {
      const res = await axiosInstance.post(`/comment/reactcomment/${commentId}`, {
        userId: user._id,
        action,
      });

      if (res.data.removed) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        return;
      }

      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? res.data.result : c))
      );
    } catch (error) {
      console.log(error);
    }
  };

  const handleTranslate = async (comment: Comment) => {
    try {
      setTranslatingCommentId(comment._id);
      const res = await axiosInstance.post("/comment/translate", {
        text: comment.commentbody,
        targetLanguage,
      });

      setTranslatedComments((prev) => ({
        ...prev,
        [comment._id]: res.data.translatedText,
      }));
    } catch (error) {
      console.log(error);
      setTranslatedComments((prev) => ({
        ...prev,
        [comment._id]: "Translation unavailable right now.",
      }));
    } finally {
      setTranslatingCommentId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await axiosInstance.delete(`/comment/deletecomment/${id}`);
      if (res.data.comment) {
        setComments((prev) => prev.filter((c) => c._id !== id));
      }
    } catch (error) {
      console.log(error);
    }
  };

  if (loading) {
    return <div>Loading comments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{comments.length} Comments</h2>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <Languages className="w-4 h-4" />
          <select
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            className="border rounded px-2 py-1 bg-white"
          >
            {languageOptions.map((language) => (
              <option key={language.value} value={language.value}>
                {language.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {user && (
        <div className="flex gap-4">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e: any) => {
                setNewComment(e.target.value);
                setCommentError("");
              }}
              className="min-h-[80px] resize-none border-0 border-b-2 rounded-none focus-visible:ring-0"
            />
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="w-3 h-3" />
              {cityName}
            </div>
            {commentError && (
              <p className="text-sm text-red-600">{commentError}</p>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => setNewComment("")}
                disabled={!newComment.trim()}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
              >
                Comment
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="flex gap-4">
              <Avatar className="w-10 h-10">
                <AvatarImage src="/placeholder.svg?height=40&width=40" />
                <AvatarFallback>{comment.usercommented[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {comment.usercommented}
                  </span>
                  <span className="text-xs text-gray-600">
                    {formatDistanceToNow(new Date(comment.commentedon))} ago
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-600">
                    <MapPin className="w-3 h-3" />
                    {comment.city || "Unknown city"}
                  </span>
                </div>

                {editingCommentId === comment._id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        onClick={handleUpdateComment}
                        disabled={!editText.trim()}
                      >
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditText("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm">{comment.commentbody}</p>
                    {translatedComments[comment._id] && (
                      <p className="text-sm text-gray-600 mt-2">
                        {translatedComments[comment._id]}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                      <button
                        className="flex items-center gap-1 disabled:opacity-50"
                        disabled={!user || comment.userid === user?._id}
                        onClick={() => handleReaction(comment._id, "like")}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        {comment.likedBy?.length || 0}
                      </button>
                      <button
                        className="flex items-center gap-1 disabled:opacity-50"
                        disabled={!user || comment.userid === user?._id}
                        onClick={() => handleReaction(comment._id, "dislike")}
                      >
                        <ThumbsDown className="w-4 h-4" />
                        {comment.dislikedBy?.length || 0}
                      </button>
                      <button
                        className="flex items-center gap-1"
                        onClick={() => handleTranslate(comment)}
                        disabled={translatingCommentId === comment._id}
                      >
                        <Languages className="w-4 h-4" />
                        {translatingCommentId === comment._id
                          ? "Translating..."
                          : "Translate"}
                      </button>
                      {comment.userid === user?._id && (
                        <>
                        <button onClick={() => handleEdit(comment)}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(comment._id)}>
                          Delete
                        </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;
