// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MedicalPortal {
    struct Log {
        string eventType;
        string description;
        uint256 timestamp;
    }

    mapping(string => Log[]) private userLogs;

    // Event to emit logs
    event LogEvent(string indexed userId, string eventType, string description, uint256 timestamp);

    // Function to log an event
    function logEvent(string memory userId, string memory eventType, string memory description) public {
        Log memory newLog = Log(eventType, description, block.timestamp);
        userLogs[userId].push(newLog);

        // Emit the event
        emit LogEvent(userId, eventType, description, block.timestamp);
    }

    // Function to retrieve logs for a user
    function getLogs(string memory userId) public view returns (Log[] memory) {
        return userLogs[userId];
    }
}
