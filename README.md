Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

Example:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]

Answer / Approach:
Use a HashMap to store (number → index).

def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        rem = target - num
        if rem in seen:
            return [seen[rem], i]
        seen[num] = i


✅ Time: O(n)
✅ Space: O(n)

🌲 Q2. Check if a Binary Tree is Height Balanced

Question:
A height-balanced binary tree is one where for every node,
|height(left) - height(right)| ≤ 1.
Return true if the tree is balanced.

Answer / Approach:
Compute height recursively and check balance condition.

def isBalanced(root):
    def height(node):
        if not node:
            return 0
        left = height(node.left)
        right = height(node.right)
        if abs(left - right) > 1:
            raise Exception("Not balanced")
        return 1 + max(left, right)
    try:
        height(root)
        return True
    except:
        return False


✅ Time: O(n)
✅ Space: O(h) (recursion stack)

🧩 Q3. Next Greater Element

Question:
Given an array, find the next greater element for each element.
If no greater element exists, output -1.

Example:
Input: [4, 5, 2, 25]
Output: [5, 25, 25, -1]

Answer / Approach:
Use stack from right to left.

def nextGreater(arr):
    n = len(arr)
    res = [-1]*n
    stack = []
    for i in range(n-1, -1, -1):
        while stack and stack[-1] <= arr[i]:
            stack.pop()
        if stack:
            res[i] = stack[-1]
        stack.append(arr[i])
    return res


✅ Time: O(n)
✅ Space: O(n)

🔁 Q4. Reverse a Linked List

Question:
Reverse a singly linked list iteratively.

Answer / Approach:
Maintain 3 pointers – prev, curr, next.

def reverseList(head):
    prev, curr = None, head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev


✅ Time: O(n)
✅ Space: O(1)

🧮 Q5. Kadane’s Algorithm (Maximum Subarray Sum)

Question:
Find the contiguous subarray with the maximum sum.

Example:
Input: [-2,1,-3,4,-1,2,1,-5,4]
Output: 6 (subarray [4,-1,2,1])

Answer / Approach:
Use dynamic programming / Kadane’s approach.

def maxSubArray(nums):
    max_ending_here = max_so_far = nums[0]
    for x in nums[1:]:
        max_ending_here = max(x, max_ending_here + x)
        max_so_far = max(max_so_far, max_ending_here)
    return max_so_far


✅ Time: O(n)
✅ Space: O(1)

Agar chaho to next main Walmart advanced DSA set (Graphs, Sliding Window, DP) ke 5 questions with explanation bhi de du —
kya chahte ho next set easy–medium or medium–hard ho?# Sonar-Canva
