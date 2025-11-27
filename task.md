# Task: Implement Checkpoint-Based Transcription

## Planning
- [x] Update implementation plan
- [x] Get user approval

## Implementation
- [x] Update recorder.ts
  - [x] Add chunk buffering
  - [x] Add createCheckpoint method
  - [x] Add elapsed time tracking
- [x] Create checkpointModal.ts
  - [x] Build UI for user notes
  - [x] Show transcribing indicator
- [x] Update recordingModal.ts
  - [x] Add checkpoint button
  - [x] Add elapsed time display
- [x] Update main.ts
  - [x] Create note on start
  - [x] Open note in split view
  - [x] Handle checkpoint creation
  - [x] Append checkpoints to note
  - [x] Add auto-checkpoint timer
  - [x] Implement speaker detection
- [x] Update settings
  - [x] Add checkpoint settings
  - [x] Add UI controls
- [x] Update transcription.ts
  - [x] Add speaker segment detection

## Verification
- [ ] Test manual checkpoint
- [ ] Test auto-checkpoint
- [ ] Verify speaker detection
- [ ] Check note updates
- [ ] Test final processing
