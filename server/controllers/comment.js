import comment from "../Modals/comment.js";
import mongoose from "mongoose";

const containsBlockedCharacters = (text = "") => {
  return /[^\p{L}\p{N}\s.,!?'"()-]/u.test(text);
};

export const postcomment = async (req, res) => {
  const { userid, videoid, commentbody, usercommented, city } = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(userid) ||
    !mongoose.Types.ObjectId.isValid(videoid)
  ) {
    return res.status(400).json({ message: "Invalid user or video id" });
  }

  if (!commentbody?.trim()) {
    return res.status(400).json({ message: "Comment cannot be empty" });
  }

  if (containsBlockedCharacters(commentbody)) {
    return res.status(400).json({
      message:
        "Comments cannot include special characters. Use letters, numbers, spaces, and basic punctuation only.",
    });
  }

  const postcomment = new comment({
    userid,
    videoid,
    commentbody: commentbody.trim(),
    usercommented,
    city: city?.trim() || "Unknown city",
  });

  try {
    const savedComment = await postcomment.save();
    return res.status(200).json({ comment: true, result: savedComment });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const getallcomment = async (req, res) => {
  const { videoid } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(videoid)) {
      return res.status(400).json({ message: "Invalid video id" });
    }

    const commentvideo = await comment.find({ videoid }).sort({ createdAt: -1 });
    return res.status(200).json(commentvideo);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const deletecomment = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }
  try {
    await comment.findByIdAndDelete(_id);
    return res.status(200).json({ comment: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const editcomment = async (req, res) => {
  const { id: _id } = req.params;
  const { commentbody } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }
  if (!commentbody?.trim()) {
    return res.status(400).json({ message: "Comment cannot be empty" });
  }
  if (containsBlockedCharacters(commentbody)) {
    return res.status(400).json({
      message:
        "Comments cannot include special characters. Use letters, numbers, spaces, and basic punctuation only.",
    });
  }
  try {
    const updatecomment = await comment.findByIdAndUpdate(_id, {
      $set: { commentbody: commentbody.trim() },
    });
    res.status(200).json(updatecomment);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const reactcomment = async (req, res) => {
  const { id: _id } = req.params;
  const { userId, action } = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(_id) ||
    !mongoose.Types.ObjectId.isValid(userId)
  ) {
    return res.status(400).json({ message: "Invalid comment or user id" });
  }

  if (!["like", "dislike"].includes(action)) {
    return res.status(400).json({ message: "Invalid reaction" });
  }

  try {
    const targetComment = await comment.findById(_id);
    if (!targetComment) {
      return res.status(404).json({ message: "Comment unavailable" });
    }

    if (targetComment.userid.toString() === userId) {
      return res
        .status(400)
        .json({ message: "You cannot react to your own comment" });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const hasLiked = targetComment.likedBy.some(
      (likedUserId) => likedUserId.toString() === userId
    );
    const hasDisliked = targetComment.dislikedBy.some(
      (dislikedUserId) => dislikedUserId.toString() === userId
    );

    if (action === "like") {
      targetComment.dislikedBy.pull(userObjectId);
      hasLiked
        ? targetComment.likedBy.pull(userObjectId)
        : targetComment.likedBy.push(userObjectId);
    } else {
      targetComment.likedBy.pull(userObjectId);
      hasDisliked
        ? targetComment.dislikedBy.pull(userObjectId)
        : targetComment.dislikedBy.push(userObjectId);
    }

    if (targetComment.dislikedBy.length >= 2) {
      await comment.findByIdAndDelete(_id);
      return res.status(200).json({ removed: true });
    }

    await targetComment.save();
    return res.status(200).json({ removed: false, result: targetComment });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const translatecomment = async (req, res) => {
  const { text, targetLanguage } = req.body;

  if (!text?.trim() || !targetLanguage?.trim()) {
    return res.status(400).json({ message: "Text and language are required" });
  }

  try {
    const googleResponse = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
        targetLanguage
      )}&dt=t&q=${encodeURIComponent(text)}`
    );

    if (googleResponse.ok) {
      const data = await googleResponse.json();
      const translatedText = data?.[0]
        ?.map((translationPart) => translationPart?.[0])
        .join("");

      if (translatedText) {
        return res.status(200).json({ translatedText });
      }
    }

    const memoryResponse = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        text
      )}&langpair=auto|${encodeURIComponent(targetLanguage)}`
    );
    const data = await memoryResponse.json();
    const translatedText = data?.responseData?.translatedText;

    if (!translatedText) {
      return res.status(502).json({ message: "Translation unavailable" });
    }

    return res.status(200).json({ translatedText });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Translation failed" });
  }
};
