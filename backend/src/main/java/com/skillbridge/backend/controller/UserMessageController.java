package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.MessageResponse;
import com.skillbridge.backend.entity.*;
import com.skillbridge.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api")
public class UserMessageController {

    @Autowired
    private MentorProgramRepository mentorProgramRepository;

    @Autowired
    private MentorApplicationRepository mentorApplicationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AdminMessageRepository adminMessageRepository;

    @GetMapping("/mentor-programs")
    public ResponseEntity<List<MentorProgram>> getMentorPrograms() {
        return ResponseEntity.ok(mentorProgramRepository.findAllByOrderByCreatedAtDesc());
    }

    @PostMapping("/mentor-programs/{programId}/apply")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<?> applyToMentorProgram(@PathVariable Long programId, Principal principal) {
        try {
            User student = userRepository.findByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Student not found"));

            MentorProgram program = mentorProgramRepository.findById(programId)
                    .orElseThrow(() -> new RuntimeException("Mentor program slot not found"));

            if (mentorApplicationRepository.existsByStudentIdAndMentorProgramId(student.getId(), programId)) {
                return ResponseEntity.badRequest().body(new MessageResponse("You have already applied for this mentor program."));
            }

            MentorApplication app = new MentorApplication(student, program);
            mentorApplicationRepository.save(app);

            return ResponseEntity.ok(new MessageResponse("Mentorship application submitted successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/messages/my")
    public ResponseEntity<List<AdminMessage>> getMyMessages(Principal principal) {
        try {
            User user = userRepository.findByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            return ResponseEntity.ok(adminMessageRepository.findByRecipientIdOrderBySentAtDesc(user.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PutMapping("/messages/{messageId}/read")
    public ResponseEntity<?> markMessageAsRead(@PathVariable Long messageId, Principal principal) {
        try {
            AdminMessage msg = adminMessageRepository.findById(messageId)
                    .orElseThrow(() -> new RuntimeException("Message not found"));

            if (!msg.getRecipient().getUsername().equals(principal.getName())) {
                return ResponseEntity.status(403).body(new MessageResponse("Unauthorized action."));
            }

            msg.setRead(true);
            adminMessageRepository.save(msg);
            return ResponseEntity.ok(new MessageResponse("Message marked as read."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
}
